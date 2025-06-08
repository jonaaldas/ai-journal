import defineAuthenticatedEventHandler from '~~/server/utils/auth-handler'
import stripeStore from '~~/server/utils/stripe-store'
import { tryCatchAsync } from '~~/server/utils/try-catch'

export default defineAuthenticatedEventHandler(async event => {
  const { user } = event.context
  const customer = (await stripeStore.getCustomer(user.id)) as { id: string }
  if (!customer) {
    throw createError({
      statusCode: 404,
      message: 'Customer not found',
    })
  }
  const { data, error } = await tryCatchAsync(stripeStore.getSubscription(customer.id))

  if (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get subscription',
    })
  }
  return data ? data : { status: 'none' }
})
