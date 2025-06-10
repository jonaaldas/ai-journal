export default defineEventHandler(async event => {
  const method = getMethod(event)
  const url = getRequestURL(event)
  const userAgent = getRequestHeader(event, 'user-agent')
  const ip = getRequestHeader(event, 'x-forwarded-for')

  console.log(`🌐 ${new Date().toISOString()} - ${method} ${url.pathname}`)
  console.log(`   IP: ${ip}`)
  console.log(`   User-Agent: ${userAgent}`)

  // Log request body for POST/PUT
  if (['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].includes(method)) {
    try {
      const body = await readBody(event)
      console.log(`   Body:`, body)
    } catch (e) {
      console.log(`   Body: [Unable to parse]`)
    }
  }
})
