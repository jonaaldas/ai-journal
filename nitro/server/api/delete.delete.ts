import { eq } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/db'
import { conversations } from '~~/db/schema'
import defineAuthenticatedEventHandler from '../utils/auth-handler'

export default defineAuthenticatedEventHandler(async event => {
  const userId = event.context.user.id
  const conversationId = getQuery(event).id

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      message: 'Conversation ID is required',
    })
  }

  try {
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId as string))
      .then(rows => rows[0])

    if (!conversation) {
      throw createError({
        statusCode: 404,
        message: 'Conversation not found',
      })
    }

    if (conversation.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: You do not have permission to delete this conversation',
      })
    }

    await db.delete(conversations).where(eq(conversations.id, conversationId as string))

    return {
      success: true,
      message: 'Conversation deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete conversation',
    })
  }
})
