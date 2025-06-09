import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'

const apiUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://ai-journal-klby.onrender.com' : 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    expoClient({
      scheme: 'ai-journal',
      storagePrefix: 'ai-journal',
      storage: SecureStore,
    }),
  ],
  trustedOrigins: ['ai-journal://', 'exp://192.168.1.37:8081/--/'],
})
