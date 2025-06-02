import { createError } from 'h3'
import { db } from '~~/db'
import { conversations } from '~~/db/schema'

// export default defineAuthenticatedEventHandler(async event => {
export default defineEventHandler(async event => {
  const userId = 'TWbp07aBFY36zCqT9Xh1eVM3f1UH4kgx'
  try {
    const newChat = await db
      .insert(conversations)
      .values({
        id: crypto.randomUUID(),
        title: 'New Chat',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .get()

    return {
      success: true,
      chat: newChat,
    }
  } catch (error) {
    console.error('Error creating chat:', error)
    if (error.statusCode === 403) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create chat',
    })
  }
})
