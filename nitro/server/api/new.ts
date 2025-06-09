import { createError } from 'h3'
import defineAuthenticatedEventHandler from '../utils/auth-handler'
import { db } from '~~/db'
import { conversations } from '~~/db/schema'
import { v4 as uuidv4 } from 'uuid'
export default defineAuthenticatedEventHandler(async event => {
  const userId = event.context.user.id
  try {
    const newChat = await db
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
