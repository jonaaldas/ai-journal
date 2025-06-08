import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import { useChat } from '@ai-sdk/react'
import { fetch as expoFetch } from 'expo/fetch'
import { useLocalSearchParams } from 'expo-router'
import { ChatContext } from '../../../context/chat-context'
import { useContext, useRef, useEffect, useState } from 'react'
import { authClient } from '../../../utils/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../../../context/auth-context'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { AutoGrowTextInput } from 'react-native-auto-grow-textinput'
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = obj => {
    return JSON.parse(JSON.stringify(obj))
  }
}

export default function Chat() {
  const { id } = useLocalSearchParams()
  const { session } = useContext(AuthContext)
  const { chats, tempToRealIdMap } = useContext(ChatContext)
  const chat = chats.find(c => c.conversation.id === id)
  const queryClient = useQueryClient()
  const scrollViewRef = useRef<ScrollView>(null)
  const isTemporaryChat = typeof id === 'string' && id.startsWith('temp-')
  const conversationIdForAPI = typeof id === 'string' && tempToRealIdMap[id] ? tempToRealIdMap[id] : id
  const { messages, input, handleSubmit, handleInputChange, status, data } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: 'http://localhost:3000/api/ai',
    onError: error => console.error(error, 'ERROR'),
    initialMessages: chat?.messages || [],
    headers: {
      Cookie: authClient.getCookie(),
    },
    body: {
      conversationId: conversationIdForAPI,
    },
    onFinish: message => {
      queryClient.invalidateQueries({ queryKey: ['chats', session?.user.id] })
    },
  })

  useEffect(() => {
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const dataItem = item as any
          if (dataItem.type === 'conversation_created' && dataItem.tempId && dataItem.realId) {
            const currentMap = queryClient.getQueryData<Record<string, string>>(['tempIdMap']) || {}
            currentMap[dataItem.tempId] = dataItem.realId
            queryClient.setQueryData(['tempIdMap'], currentMap)
          }
        }
      })
    }
  }, [data, queryClient])

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages, status])

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 20,
              flexGrow: 1,
              justifyContent: messages.length === 0 && !isTemporaryChat ? 'flex-end' : 'flex-start',
            }}
            showsVerticalScrollIndicator={false}>
            {messages.map((m, index) => (
              <View
                key={`${m.id}-${index}`}
                className={`mb-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <View className={`flex-row items-end max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <View className={`w-8 h-8 rounded-full ${m.role === 'user' ? 'bg-blue-600 ml-2' : 'bg-gray-400 mr-2'} items-center justify-center`}>
                    {m.role === 'user' ? (
                      <Ionicons
                        name="person"
                        size={16}
                        color="white"
                      />
                    ) : (
                      <Ionicons
                        name="chatbubble"
                        size={16}
                        color="white"
                      />
                    )}
                  </View>

                  <View className={`px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 rounded-br-md' : 'bg-white rounded-bl-md border border-gray-200'}`}>
                    <Text className={`text-base leading-5 ${m.role === 'user' ? 'text-white' : 'text-gray-900'}`}>{m.content}</Text>
                  </View>
                </View>
              </View>
            ))}

            {status === 'submitted' && (
              <View className="items-start mb-4">
                <View className="flex-row items-end max-w-[80%]">
                  <View className="w-8 h-8 rounded-full bg-gray-400 mr-2 items-center justify-center">
                    <Ionicons
                      name="chatbubble"
                      size={16}
                      color="white"
                    />
                  </View>
                  <View className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-gray-200">
                    <View className="flex-row items-center">
                      <View className="flex-row space-x-1 mr-2">
                        <View className="w-2 h-2 bg-gray-400 rounded-full" />
                        <View className="w-2 h-2 bg-gray-400 rounded-full" />
                        <View className="w-2 h-2 bg-gray-400 rounded-full" />
                      </View>
                      <Text className="text-gray-500 text-sm italic">AI is thinking...</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {isTemporaryChat && messages.length === 0 && (
              <View className="items-center justify-center py-20">
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color="#2563eb"
                  />
                </View>
                <Text className="text-lg font-medium text-gray-600 mb-2">New Chat Ready!</Text>
                <Text className="text-sm text-gray-500 text-center px-8">Start a conversation by typing your message below.</Text>
              </View>
            )}
          </ScrollView>

          <View className="w-full bg-gray-50 border-t border-gray-200 px-4 py-2 flex flex-row justify-between gap-4">
            <View className="w-full mb-2 flex-1 bg-white border border-gray-300 rounded-3xl shadow-sm overflow-hidden">
              <AutoGrowTextInput
                className="bg-transparent px-4 py-3 text-base leading-6"
                placeholderTextColor="#8E8E93"
                placeholder="Type a message..."
                returnKeyType="default"
                blurOnSubmit={false}
                value={input}
                onChangeText={text => {
                  handleInputChange({ target: { value: text } } as any)
                }}
                minHeight={48}
                maxHeight={120}
                style={{
                  textAlignVertical: 'top',
                }}
              />
            </View>
            <View className="flex-row items-end justify-end">
              <TouchableOpacity
                className={`w-8 h-8 rounded-full items-center justify-center ${status === 'streaming' || !input.trim() ? 'bg-gray-200' : 'bg-blue-500'}`}
                onPress={() => {
                  if (input.trim()) {
                    handleSubmit()
                  }
                }}
                disabled={status === 'streaming' || !input.trim()}
                activeOpacity={0.7}>
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={status === 'streaming' || !input.trim() ? '#9CA3AF' : 'white'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}
