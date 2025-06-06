import { auth } from '~~/server/utils/auth-server'

export default defineEventHandler(async event => {
  return auth.handler(toWebRequest(event))
})
