import { appendClientMessage, createDataStreamResponse, streamText, customProvider, wrapLanguageModel, extractReasoningMiddleware, smoothStream, appendResponseMessages } from 'ai'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { db } from '~~/db'
import { eq } from 'drizzle-orm'
import { stream } from '~~/db/schema'
import { messages as messagesTable } from '~~/db/schema'
import defineAuthenticatedEventHandler from '../utils/auth-handler'

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
    const { messages, conversationId } = await readBody(event)
    const userId = event.context.user.id
    const conversationID = conversationId
    const prevMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationID as string))
    const messageBody = messages[messages.length - 1]
    const messageId = crypto.randomUUID()
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
      conversationId: conversationID as string,
      role: 'user',
      content: messageBody.content,
      createdAt: new Date(),
    })
    const streamId = crypto.randomUUID()
    await db.insert(stream).values({
      id: streamId,
      conversationId: conversationID,
      createdAt: new Date(),
    })

    const streamValue = createDataStreamResponse({
      execute: dataStream => {
        const result = streamText({
          model: languageModel.languageModel('chat-model'),
          system: 'You are a helpful assistant.',
          messages: allMessages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: () => crypto.randomUUID(),
          onFinish: async ({ response }) => {
            if (userId) {
              try {
                const [, assistantMessage] = appendResponseMessages({
                  messages: [messageBody],
                  responseMessages: response.messages,
                })

                await db.insert(messagesTable).values({
                  id: crypto.randomUUID() as string,
                  conversationId: conversationID as string,
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
