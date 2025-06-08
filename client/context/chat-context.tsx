import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext } from 'react'
import fetch from '../utils/fetch'
import type { UIMessage } from 'ai'
import { useContext } from 'react'
import { AuthContext } from './auth-context'
import { router } from 'expo-router'

type ChatWithMessages = {
  conversation: {
    id: string
    createdAt: Date
    updatedAt: Date
    userId: string
    title: string
  }
  messages: UIMessage[]
}

export const ChatContext = createContext<{
  chats: ChatWithMessages[]
  handleNewChat: () => void
  isLoading: boolean
  tempToRealIdMap: Record<string, string>
  handleDeleteChat: (chatId: string) => void
}>({
  chats: [],
  handleNewChat: () => {},
  isLoading: false,
  tempToRealIdMap: {},
  handleDeleteChat: () => {},
})

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats', session?.user.id],
    queryFn: () => fetch.get<{ success: boolean; chats: ChatWithMessages[] }>('/api/list'),
  })

  const tempToRealIdMap = queryClient.getQueryData<Record<string, string>>(['tempIdMap']) || {}

  const handleNewChat = useMutation({
    mutationFn: () => fetch.post<{ success: boolean; chat: { id: string; title: string; userId: string; createdAt: Date; updatedAt: Date } }>('/api/new'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['chats', session?.user.id] })

      const tempId = `temp-${Date.now()}`
      const optimisticChat: ChatWithMessages = {
        conversation: {
          id: tempId,
          title: 'New Chat',
          userId: session?.user.id || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        messages: [],
      }

      const previousChats = queryClient.getQueryData<{ success: boolean; chats: ChatWithMessages[] }>(['chats', session?.user.id])

      queryClient.setQueryData<{ success: boolean; chats: ChatWithMessages[] }>(['chats', session?.user.id], old => ({
        success: true,
        chats: [optimisticChat, ...(old?.chats || [])],
      }))

      router.push(`/chat/${tempId}`)

      return { previousChats, tempId }
    },
    onError: (err, variables, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', session?.user.id], context.previousChats)
      }
      if (context?.tempId) {
        const currentMap = queryClient.getQueryData<Record<string, string>>(['tempIdMap']) || {}
        delete currentMap[context.tempId]
        queryClient.setQueryData(['tempIdMap'], currentMap)
      }
      console.error('Failed to create chat:', err)
    },
    onSuccess: (data, variables, context) => {
      if (data.success && data.chat && context?.tempId) {
        // Store the mapping from temp ID to real ID
        const currentMap = queryClient.getQueryData<Record<string, string>>(['tempIdMap']) || {}
        currentMap[context.tempId] = data.chat.id
        queryClient.setQueryData(['tempIdMap'], currentMap)

        // Update the chat data but keep the temp ID in the UI for seamless experience
        queryClient.setQueryData<{ success: boolean; chats: ChatWithMessages[] }>(['chats', session?.user.id], old => {
          if (!old) return { success: true, chats: [{ conversation: data.chat, messages: [] }] }

          return {
            success: true,
            chats: old.chats.map(chat => (chat.conversation.id === context.tempId ? { conversation: { ...data.chat, id: context.tempId }, messages: [] } : chat)),
          }
        })
      }
    },
  })

  const handleDeleteChat = useMutation({
    mutationFn: (chatId: string) => fetch.delete(`/api/delete?id=${chatId}`),
    onMutate: async chatId => {
      await queryClient.cancelQueries({ queryKey: ['chats', session?.user.id] })

      const previousChats = queryClient.getQueryData<{ success: boolean; chats: ChatWithMessages[] }>(['chats', session?.user.id])

      queryClient.setQueryData<{ success: boolean; chats: ChatWithMessages[] }>(['chats', session?.user.id], old => ({
        success: true,
        chats: old?.chats.filter(chat => chat.conversation.id !== chatId) || [],
      }))

      return { previousChats }
    },
    onError: (err, variables, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', session?.user.id], context.previousChats)
      }
    },
  })

  return (
    <ChatContext.Provider
      value={{
        chats: chats?.chats || [],
        handleNewChat: handleNewChat.mutate,
        isLoading,
        tempToRealIdMap,
        handleDeleteChat: handleDeleteChat.mutate,
      }}>
      {children}
    </ChatContext.Provider>
  )
}
