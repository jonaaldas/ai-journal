import { User } from 'better-auth'
import type { H3Event, H3EventContext } from 'h3'
import { auth } from '../utils/auth-server'

type AuthenticatedEvent = H3Event & {
  context: H3EventContext & {
    user: User
  }
}

export default function defineAuthenticatedEventHandler<T>(handler: (event: AuthenticatedEvent) => T) {
  return defineEventHandler(async event => {
    const session = await auth.api.getSession({
      headers: event.headers,
    })

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    event.context.user = session?.user
    return handler(event as AuthenticatedEvent)
  })
}
