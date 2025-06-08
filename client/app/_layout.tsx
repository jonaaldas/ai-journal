import { Suspense } from 'react'
import '@/assets/css/global.css'
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { ActivityIndicator, Button, SafeAreaView, Text, TouchableOpacity } from 'react-native'
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite'
import { Slot, Stack } from 'expo-router'
import { AuthProvider } from '../context/auth-context'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import '../assets/css/global.css'
import { KeyboardProvider } from 'react-native-keyboard-controller'
export const DATABASE_NAME = 'tasks'
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <GluestackUIProvider mode="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Suspense fallback={<ActivityIndicator size="large" />}>
              <SQLiteProvider
                databaseName={DATABASE_NAME}
                options={{ enableChangeListener: true }}
                useSuspense>
                <Slot />
              </SQLiteProvider>
            </Suspense>
          </AuthProvider>
        </QueryClientProvider>
      </GluestackUIProvider>
    </KeyboardProvider>
  )
}
