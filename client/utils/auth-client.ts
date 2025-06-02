import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
  plugins: [
    expoClient({
      scheme: 'ai-journal',
      storagePrefix: 'ai-journal',
      storage: SecureStore,
    }),
  ],
  trustedOrigins: ['ai-journal://', 'exp://192.168.1.37:8081/--/'],
})
