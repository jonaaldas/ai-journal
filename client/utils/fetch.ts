import { ofetch } from 'ofetch'
import { authClient } from './auth-client'

const api = ofetch.create({
  baseURL: 'http://localhost:3000',
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
