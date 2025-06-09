//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'server',
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  devStorage: {
    cache: {
      driver: 'fs',
      base: './cache',
    },
  },
  storage: {
    cache: {
      driver: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  },
})
