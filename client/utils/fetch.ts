// import { ofetch } from 'ofetch'
import { authClient } from './auth-client'
import { fetch } from 'expo/fetch'

const baseURL = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://ai-journal-klby.onrender.com/' : 'http://localhost:3000')
const fetcher = (url: string, method: string, body?: unknown) =>
  fetch(baseURL + url, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: authClient.getCookie() || '',
    },
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
const fetchCall = {
  get: (url: string) => fetcher(url, 'GET'),
  post: (url: string, body?: unknown) => fetcher(url, 'POST', body),
  put: (url: string, body?: unknown) => fetcher(url, 'PUT', body),
  delete: (url: string) => fetcher(url, 'DELETE'),
}

// const api = ofetch.create({
//   baseURL,
//   credentials: 'include',
//   onRequest({ options }) {
//     const headers = new Headers(options.headers)
//     headers.set('Cookie', authClient.getCookie())
//     options.headers = headers
//   },
// })

// const fetch = {
//   get: <T>(url: string) => api<T>(url),
//   post: <T>(url: string, data?: unknown) => api<T>(url, { method: 'POST', body: data }),
//   put: <T>(url: string, data?: unknown) => api<T>(url, { method: 'PUT', body: data }),
//   delete: <T>(url: string) => api<T>(url, { method: 'DELETE' }),
// }

export default fetchCall
