import defineAuthenticatedEventHandler from '~~/server/utils/auth-handler'
import { stripe } from '~~/server/utils/stripe'

export default defineAuthenticatedEventHandler(async event => {
  const cachedCustomer = await useStorage('cache').getItem(`stripe:customer:${event.context.user.id}`)
  if (!cachedCustomer) {
    return false
  }
  const customerId = (cachedCustomer as any).id
  const subscription = await stripe.subscriptions.list({ customer: customerId, status: 'active' })
  return subscription.data[0]?.status === 'active' ? true : false // TODO: check if trial is active
})
