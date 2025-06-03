import { Suspense } from 'react'
import { ActivityIndicator, Button, SafeAreaView, Text, TouchableOpacity } from 'react-native'
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite'
import { Slot, Stack } from 'expo-router'
import { AuthProvider } from '../context/auth-context'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
export const DATABASE_NAME = 'tasks'
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
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
  )
}
