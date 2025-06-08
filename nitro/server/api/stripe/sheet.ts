import type { User } from 'better-auth'
import Stripe from 'stripe'
import defineAuthenticatedEventHandler from '~~/server/utils/auth-handler'

type UserWithStripeCustomerId = User & {
  stripeCustomerId: string
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2025-05-28.basil',
  appInfo: {
    name: 'AI Journal',
  },
})

const prices = {
  monthly: 'price_1RSgesPW6ilRA0XQTlGcIM1w',
  yearly: 'price_1RSgf9PW6ilRA0XQHm6TDiO0',
}

export default defineAuthenticatedEventHandler(async event => {
  try {
    const user = event.context.user as UserWithStripeCustomerId
    const body = await readBody(event)
    const period = body.period as 'monthly' | 'yearly'

    const cachedCustomer = await useStorage('cache').getItem(`stripe:customer:${user.id}`)
    const customerId = user.stripeCustomerId || (cachedCustomer as any)?.id

    if (!customerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No Stripe customer found',
      })
    }

    const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2025-04-30.basil' })

    const hasTrial = period === 'monthly'

    if (hasTrial) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      })

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: prices[period] }],
        trial_period_days: 3,
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
      })

      return {
        success: true,
        setupIntentClientSecret: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        subscriptionId: subscription.id,
        hasTrial: true,
      }
    } else {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: prices[period] }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret'],
      })

      return {
        success: true,
        clientSecret: subscription.latest_invoice.confirmation_secret?.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        hasTrial: false,
      }
    }
  } catch (error) {
    console.error('Stripe subscription creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create subscription',
    })
  }
})
