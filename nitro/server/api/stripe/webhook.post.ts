import type Stripe from 'stripe'
import { stripe } from '~~/server/utils/stripe'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_T4ZEb8wbGYOvD8xfrWkg5L46NmlRTR5E'
// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV || ' whsec_707441a4edd442fe7629665520724dc9244c963954a9230bfc6ff5243d55ca74'

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string | null
      status: Stripe.Subscription.Status
      priceId: string | null
      currentPeriodStart: number | null
      currentPeriodEnd: number | null
      cancelAtPeriodEnd: boolean
      paymentMethod: {
        brand: string | null
        last4: string | null
      } | null
    }
  | {
      status: 'none'
    }

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
]

export default defineEventHandler(async event => {
  try {
    const rawBody = await readRawBody(event, false)
    const signature = getHeader(event, 'stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      throw createError({
        statusCode: 400,
        message: 'Missing stripe-signature header',
      })
    }

    if (!rawBody) {
      console.error('Missing request body')
      throw createError({
        statusCode: 400,
        message: 'Missing request body',
      })
    }

    let stripeEvent: Stripe.Event

    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      throw createError({
        statusCode: 400,
        message: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }

    event.waitUntil(processEvent(stripeEvent))

    return { received: true }
  } catch (error) {
    if ('statusCode' in (error as any)) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Internal server error',
    })
  }
})

async function processEvent(event: Stripe.Event) {
  if (!allowedEvents.includes(event.type)) return
  const { customer: customerId } = event?.data?.object as {
    customer: string
  }

  if (typeof customerId !== 'string') {
    throw new Error(`[STRIPE HOOK][CANCER] ID isn't string.\nEvent type: ${event.type}`)
  }

  return await syncStripeDataToKV(customerId)
}

export async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method'],
  })

  if (subscriptions.data.length === 0) {
    const subData = { status: 'none' }
    await useStorage('cache').setItem(`stripe:subscription:${customerId}`, subData)
    return subData
  }

  const subscription = subscriptions.data[0]
  const firstItem = subscription.items.data[0]

  const subData: STRIPE_SUB_CACHE = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: firstItem.price.id,
    currentPeriodEnd: firstItem.current_period_end ?? null,
    currentPeriodStart: firstItem.current_period_start ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  }

  await useStorage('cache').setItem(`stripe:subscription:${customerId}`, subData)
  return subData
}
