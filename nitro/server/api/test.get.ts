import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { useRuntimeConfig } from '#imports'

const redis = new Redis({
  url: useRuntimeConfig().upstashRedisRestUrl,
  token: useRuntimeConfig().upstashRedisRestToken,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, '30s'),
})

export default defineEventHandler(async event => {
  const ip = getRequestIP(event)
  console.log('ip', ip)
  const { success, remaining } = await ratelimit.limit(ip)
  console.log('remaining', remaining)
  if (!success) {
    throw createError({
      statusCode: 429,
      message: 'Rate limit exceeded',
    })
  }

  return {
    message: 'Hello World',
  }
})
