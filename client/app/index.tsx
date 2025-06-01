import { View, Text, Button, TextInput, FlatList, ScrollView } from 'react-native'
import { useChat } from '@ai-sdk/react'
import { fetch as expoFetch } from 'expo/fetch'

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = obj => {
    return JSON.parse(JSON.stringify(obj))
  }
}

export default function Index() {
  const { messages, input, handleSubmit, handleInputChange, status } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: 'http://localhost:3000/api/ai',
    onError: error => console.error(error, 'ERROR'),
  })

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView style={{ flex: 1 }}>
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
        {status === 'streaming' && (
          <View style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text style={{ fontStyle: 'italic' }}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ marginTop: 16 }}>
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
