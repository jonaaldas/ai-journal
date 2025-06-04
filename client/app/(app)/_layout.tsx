import { Text } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { AuthContext } from '../../context/auth-context'
import { useContext } from 'react'
import { ChatProvider } from '../../context/chat-context'

export default function AppLayout() {
  const { isPending, session } = useContext(AuthContext)

  if (isPending) {
    return <Text>Loading...</Text>
  }

  if (!session) {
    return <Redirect href="/login" />
  }

  return (
    <ChatProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: true, title: 'Chats' }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: true, title: 'Chat' }}
        />
      </Stack>
    </ChatProvider>
  )
}
