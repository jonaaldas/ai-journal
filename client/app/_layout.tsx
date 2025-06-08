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
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import ExpoStripeProvider from '../components/expo-stripe-provider'
export const DATABASE_NAME = 'tasks'
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <GluestackUIProvider mode="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ExpoStripeProvider>
              <Suspense fallback={<ActivityIndicator size="large" />}>
                <SQLiteProvider
                  databaseName={DATABASE_NAME}
                  options={{ enableChangeListener: true }}
                  useSuspense>
                  <GestureHandlerRootView>
                    <Slot />
                  </GestureHandlerRootView>
                </SQLiteProvider>
              </Suspense>
            </ExpoStripeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GluestackUIProvider>
    </KeyboardProvider>
  )
}
