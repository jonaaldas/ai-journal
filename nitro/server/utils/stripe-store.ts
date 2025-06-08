const getCustomer = async (userId: string) => {
  const cachedCustomer = await useStorage('cache').getItem(`stripe:customer:${userId}`)
  return cachedCustomer
}

const getSubscription = async (customerId: string) => {
  const cachedSubscription = await useStorage('cache').getItem(`stripe:subscription:${customerId}`)
  return cachedSubscription ? cachedSubscription : null
}

const getSubscriptionStatus = async (userId: string) => {
  const customer = (await getCustomer(userId)) as { id: string }
  const id = customer?.id
  if (!id) {
    return null
  }
  const cachedSubscription = await useStorage('cache').getItem(`stripe:subscription:${id}`)
  return (cachedSubscription as any)?.status
}

export default {
  getCustomer,
  getSubscription,
  getSubscriptionStatus,
}
