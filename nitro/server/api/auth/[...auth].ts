import { auth } from '~~/server/utils/auth-server'

export default defineEventHandler(event => {
  return auth.handler(toWebRequest(event))
})
