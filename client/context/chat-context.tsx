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

export const ChatContext = createContext<{ chats: ChatWithMessages[]; handleNewChat: () => void; isLoading: boolean }>({
  chats: [],
  handleNewChat: () => {},
  isLoading: false,
})

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats', session?.user.id],
    queryFn: () => fetch.get<{ success: boolean; chats: ChatWithMessages[] }>('/api/list'),
  })

  const handleNewChat = useMutation({
    mutationFn: () => fetch.post('/api/new'),
    onMutate: async () => {
      router.push('/chat/new')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', session?.user.id] })
    },
  })

  return <ChatContext.Provider value={{ chats: chats?.chats || [], handleNewChat: handleNewChat.mutate, isLoading }}>{children}</ChatContext.Provider>
}
