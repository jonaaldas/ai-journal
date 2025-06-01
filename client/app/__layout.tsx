import { Text, View } from 'react-native'
import * as SQLite from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { tasks } from '../db/schema'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from '../drizzle/migrations'

const expo = SQLite.openDatabaseSync('db.db')

const db = drizzle(expo)

export default function App() {
  const { success, error } = useMigrations(db, migrations)
  console.log('🚀 ~ App ~ success:', success)
  console.log('🚀 ~ App ~ error:', error)
  const [items, setItems] = useState<(typeof tasks.$inferSelect)[] | null>(null)

  useEffect(() => {
    if (!success) return
    ;(async () => {
      await db.delete(tasks)

      await db.insert(tasks).values([
        {
          name: 'Task 1',
          list_id: 1,
        },
      ])

      const allTasks = await db.select().from(tasks)
      setItems(allTasks)
    })()
  }, [success])

  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    )
  }

  if (!success) {
    return (
      <View>
        <Text>Migration is in progress...</Text>
      </View>
    )
  }

  if (items === null || items.length === 0) {
    return (
      <View>
        <Text>Empty</Text>
      </View>
    )
  }

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      }}>
      {items.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  )
}
