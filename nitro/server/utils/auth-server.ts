import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { customSession } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { db } from '~~/db'
import * as schema from '~~/db/schema'
import { stripe } from './stripe'
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
    },
  }),
  databaseHooks: {
    account: {
      create: {
        before: async (account, context) => {
          try {
            const customer = await stripe.customers.create({
              email: context.body.email,
              metadata: {
                id: account.id,
              },
            })
            await useStorage('cache').setItem(`stripe:customer:${account.userId}`, customer)
            await db
              .update(schema.user)
              .set({
                stripeCustomerId: customer.id,
              })
              .where(eq(schema.user.id, account.userId))
            return true
          } catch (error) {
            throw new Error(`Failed to create Stripe customer: ${error.message}`)
          }
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 60, // 60 days
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo()],
  trustedOrigins: ['ai-journal://', 'exp://192.168.1.37:8081/--/'],
})

type Session = typeof auth.$Infer.Session
