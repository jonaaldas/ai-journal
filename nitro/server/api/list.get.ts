import { Attachment, UIMessage } from 'ai'
import { desc, eq, inArray } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/db'
import { conversations, messages } from '~~/db/schema'
import type { Message as MessageType } from '~~/db/schema'

export default defineEventHandler(async event => {
  const userId = 'TWbp07aBFY36zCqT9Xh1eVM3f1UH4kgx'

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  try {
    const userChats = await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt))

    if (!userChats.length) {
      return {
        success: true,
        chats: [],
      }
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(
        inArray(
          messages.conversationId,
          userChats.map(chat => chat.id)
        )
      )
      .orderBy(desc(messages.createdAt))
    const uiMessages = convertToUIMessages(allMessages)

    const messagesByConversation = uiMessages.reduce((acc, msg) => {
      if (!acc[msg.conversationId]) acc[msg.conversationId] = []
      acc[msg.conversationId].push({
        role: msg.role,
        content: msg.content,
      })
      return acc
    }, {} as Record<string, any[]>)

    const chatsWithMessages = userChats.map(conversation => ({
      conversation: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
      },
      messages: messagesByConversation[conversation.id] || [],
    }))

    return {
      success: true,
      chats: chatsWithMessages,
    }
  } catch (error) {
    console.error('Error fetching chats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch chats',
    })
  }
})

function convertToUIMessages(messages: MessageType[]): Array<UIMessage & { conversationId: string }> {
  try {
    return messages.map(message => ({
      conversationId: message.conversationId,
      id: message.id,
      parts: message.parts as unknown as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      content: message.content,
      createdAt: message.createdAt,
      experimental_attachments: (message.parts as unknown as Array<Attachment>) ?? [],
    }))
  } catch (error) {
    console.error('Error converting messages to UI messages:', error)
    return []
  }
}
