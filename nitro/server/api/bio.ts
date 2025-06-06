import defineAuthenticatedEventHandler from '../utils/auth-handler'
import { db } from '../../db'
import { user } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineAuthenticatedEventHandler(async event => {
  if (event.method === 'POST') {
    const { bio } = await readBody(event)
    const updatedUser = await db.update(user).set({ bio }).where(eq(user.id, event.context.user.id))
    return updatedUser
  }

  if (event.method === 'GET') {
    const userInfo = await db.select().from(user).where(eq(user.id, event.context.user.id)).limit(1)
    return userInfo[0]
  }
})
