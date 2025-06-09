import { appendClientMessage, createDataStreamResponse, streamText, customProvider, wrapLanguageModel, extractReasoningMiddleware, smoothStream, appendResponseMessages } from 'ai'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { db } from '~~/db'
import { eq } from 'drizzle-orm'
import { stream, conversations, user } from '~~/db/schema'
import { messages as messagesTable } from '~~/db/schema'
import defineAuthenticatedEventHandler from '../utils/auth-handler'
import { createError } from 'h3'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'
const redis = new Redis({
  url: 'https://learning-mite-34773.upstash.io',
  token: 'AYfVAAIjcDE5NGNjZDBjNGQ5MzQ0NTRlYjg4Y2UxYjU5YWNiNDdjMnAxMA',
})
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, '30s'),
})

const languageModel = customProvider({
  languageModels: {
    'chat-model': openai('gpt-4o-mini'),
    'chat-model-reasoning': wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4o-mini'),
    'artifact-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('gpt-4o-mini'),
  },
})

export default defineLazyEventHandler(async () => {
  return defineAuthenticatedEventHandler(async event => {
    console.log('running')
    // call ratelimit with request ip
    const ip = getRequestIP(event)
    const { success, remaining } = await ratelimit.limit(ip)

    if (!success) {
      throw createError({
        statusCode: 429,
        message: 'Rate limit exceeded',
      })
    }

    console.log('remaining', remaining)
    const { messages, conversationId } = await readBody(event)
    const userId = event.context.user.id
    const conversationID = conversationId

    let actualConversationId = conversationID as string
    let wasTemporary = false

    if (conversationID.startsWith('temp-')) {
      wasTemporary = true
      const newConversation = await db
        .insert(conversations)
        .values({
          id: uuidv4(),
          title: 'New Chat',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .get()

      actualConversationId = newConversation.id
    } else {
      const existingConversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationID as string))
        .limit(1)

      if (!existingConversation.length) {
        throw createError({
          statusCode: 404,
          message: 'Conversation not found. Please create a new conversation first.',
        })
      }

      if (existingConversation[0].userId !== userId) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to access this conversation.',
        })
      }
    }

    const prevMessages = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, actualConversationId))
    const messageBody = messages[messages.length - 1]
    const messageId = uuidv4()
    const allMessages = appendClientMessage({
      messages: prevMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      message: {
        id: messageId,
        role: 'user',
        content: messageBody.content,
      },
    })
    await db.insert(messagesTable).values({
      id: messageId as string,
      conversationId: actualConversationId,
      role: 'user',
      content: messageBody.content,
      createdAt: new Date(),
    })
    const streamId = uuidv4()
    await db.insert(stream).values({
      id: streamId,
      conversationId: actualConversationId,
      createdAt: new Date(),
    })
    const userBio = await db.select({ bio: user.bio }).from(user).where(eq(user.id, userId)).limit(1)

    const streamValue = createDataStreamResponse({
      execute: dataStream => {
        if (wasTemporary) {
          dataStream.writeData({
            type: 'conversation_created',
            tempId: conversationID,
            realId: actualConversationId,
          })
        }

        const result = streamText({
          model: languageModel.languageModel('chat-model'),
          system: `You are my therapist, journal, and friend. I write to you and you never judge me. All you do is listen and help me go through this fucked up life. This is who I am: ${userBio[0].bio}`,
          messages: allMessages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: () => uuidv4(),
          onFinish: async ({ response }) => {
            if (userId) {
              try {
                const [, assistantMessage] = appendResponseMessages({
                  messages: [messageBody],
                  responseMessages: response.messages,
                })

                await db.insert(messagesTable).values({
                  id: uuidv4() as string,
                  conversationId: actualConversationId,
                  role: assistantMessage.role as 'assistant',
                  content: assistantMessage.content,
                  parts: assistantMessage.parts ? JSON.stringify(assistantMessage.parts) : null,
                  createdAt: new Date(),
                })
              } catch (error) {
                console.error('Failed to save chat:', error)
              }
            }
          },
        })

        result.consumeStream().catch(error => {
          console.error('Stream consumption error:', error)
          dataStream.writeData({ type: 'error', error: 'Stream consumption failed' })
        })

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        })
      },
      onError: error => {
        console.error('Stream error:', error)
        return 'Oops, an error occurred!'
      },
    })

    return streamValue
  })
})
