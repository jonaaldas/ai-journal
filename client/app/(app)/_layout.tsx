import { Button, Text, View } from 'react-native'
import { Redirect, router, Stack } from 'expo-router'
import { AuthContext } from '../../context/auth-context'
import { useContext } from 'react'
import { ChatProvider } from '../../context/chat-context'

export default function AppLayout() {
  const { isPending, session } = useContext(AuthContext)

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading app preferences...</Text>
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/login" />
  }

  return (
    <ChatProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: 'Chats',
            headerRight: () => (
              <Button
                title="Settings"
                onPress={() => router.push('/settings')}
              />
            ),
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            title: 'Chat',
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: true,
            title: 'Settings',
            headerRight: () => (
              <Button
                title="Close"
                onPress={() => router.push('/initial-setup')}
              />
            ),
          }}
        />
        <Stack.Screen
          name="settings/subscription"
          options={{ headerShown: true, title: 'Subscription' }}
        />
        <Stack.Screen
          name="initial-setup"
          options={{ headerShown: false }}
        />
      </Stack>
    </ChatProvider>
  )
}
