import { Suspense } from 'react'
import { ActivityIndicator, Button, SafeAreaView, Text, TouchableOpacity } from 'react-native'
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from './drizzle/migrations'
import { Stack } from 'expo-router'

export const DATABASE_NAME = 'tasks'

export default function RootLayout() {
  const expoDb = openDatabaseSync(DATABASE_NAME)
  const db = drizzle(expoDb)
  const { success, error } = useMigrations(db, migrations)
  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Stack>
            <Stack.Screen name="/" />
          </Stack>
        </SafeAreaView>
      </SQLiteProvider>
    </Suspense>
  )
}
