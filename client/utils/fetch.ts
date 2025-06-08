import { ofetch } from 'ofetch'
import { authClient } from './auth-client'
const baseURL = process.env.NODE_ENV === 'production' ? 'https://ai-journal-klby.onrender.com/' : 'http://localhost:3000'
const api = ofetch.create({
  baseURL,
  credentials: 'include',
  onRequest({ options }) {
    const headers = new Headers(options.headers)
    headers.set('Cookie', authClient.getCookie())
    options.headers = headers
  },
})

const fetch = {
  get: <T>(url: string) => api<T>(url),
  post: <T>(url: string, data?: unknown) => api<T>(url, { method: 'POST', body: data }),
  put: <T>(url: string, data?: unknown) => api<T>(url, { method: 'PUT', body: data }),
  delete: <T>(url: string) => api<T>(url, { method: 'DELETE' }),
}

export default fetch
