//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'server',
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  devStorage: {
    cache: {
      driver: 'fs',
      base: './storage/cache',
    },
  },
})
