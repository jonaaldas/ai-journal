import { View, Text, Button, TextInput, FlatList, ScrollView, Alert } from 'react-native'
import { useChat } from '@ai-sdk/react'
import { fetch as expoFetch } from 'expo/fetch'
import { useLocalSearchParams } from 'expo-router'
import { ChatContext } from '../../../context/chat-context'
import { useContext, useRef, useEffect } from 'react'
import { authClient } from '../../../utils/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../../../context/auth-context'

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = obj => {
    return JSON.parse(JSON.stringify(obj))
  }
}

export default function Chat() {
  const { id } = useLocalSearchParams()
  const { session } = useContext(AuthContext)
  const { chats } = useContext(ChatContext)
  const chat = chats.find(c => c.conversation.id === id)
  const queryClient = useQueryClient()
  const scrollViewRef = useRef<ScrollView>(null)

  const { messages, input, handleSubmit, handleInputChange, status } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: 'http://localhost:3000/api/ai',
    onError: error => console.error(error, 'ERROR'),
    initialMessages: chat?.messages || [],
    headers: {
      Cookie: authClient.getCookie(),
    },
    body: {
      conversationId: id,
    },
    onFinish: message => {
      queryClient.invalidateQueries({ queryKey: ['chats', session?.user.id] })
    },
  })

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages, status])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}>
        {messages.map(m => (
          <View
            key={m.id}
            style={{
              marginVertical: 8,
              padding: 12,
              backgroundColor: m.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: 8,
            }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4, textTransform: 'capitalize' }}>{m.role}</Text>
            <Text>{m.content}</Text>
          </View>
        ))}
        {status === 'submitted' && (
          <View style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text style={{ fontStyle: 'italic' }}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd' }}>
        <TextInput
          style={{
            backgroundColor: 'white',
            padding: 12,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            minHeight: 44,
          }}
          placeholder="Say something..."
          value={input}
          onChangeText={text => {
            handleInputChange({ target: { value: text } } as any)
          }}
          onSubmitEditing={() => {
            if (input.trim()) {
              handleSubmit()
            }
          }}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Button
          title={status === 'streaming' ? 'Sending...' : 'Send'}
          onPress={() => {
            if (input.trim()) {
              handleSubmit()
            }
          }}
          disabled={status === 'streaming' || !input.trim()}
        />
      </View>
    </View>
  )
}
