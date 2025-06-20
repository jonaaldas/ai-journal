import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useContext } from 'react'
import { ChatContext } from '../../context/chat-context'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SharedValue } from 'react-native-reanimated'

export default function Index() {
  const { chats, handleNewChat, isLoading, handleDeleteChat } = useContext(ChatContext)

  const renderRightActions = (conversationId: string, progress: SharedValue<number>, dragX: SharedValue<number>) => {
    return (
      <View className="flex-row">
        <TouchableOpacity
          className="bg-red-500 w-[75] justify-center items-center"
          onPress={() => handleDeleteChat(conversationId)}>
          <Ionicons
            name="trash-outline"
            size={24}
            color="white"
          />
          <Text className="text-white text-sm mt-1">Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 relative">
      <ScrollView className="flex-1">
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            className="flex-1 justify-center items-center"
          />
        ) : chats.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Ionicons
                name="chatbubble-outline"
                size={32}
                color="#2563eb"
              />
            </View>
            <Text className="text-lg font-medium text-gray-600">No chats yet</Text>
          </View>
        ) : (
          chats.map(chat => (
            <Swipeable
              key={chat.conversation.id}
              renderRightActions={(progress, dragX) => renderRightActions(chat.conversation.id, progress, dragX)}
              rightThreshold={40}>
              <TouchableOpacity
                onPress={() => router.push(`/chat/${chat.conversation.id}`)}
                className="flex flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons
                    name="chatbubble"
                    size={22}
                    color="#2563eb"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{chat.conversation.title}</Text>
                  <Text
                    className="text-sm text-gray-500"
                    numberOfLines={1}>
                    {chat.messages[0]?.content || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </ScrollView>
      <TouchableOpacity
        className="absolute bottom-10 right-10 size-20 rounded-full bg-blue-500 flex items-center justify-center"
        onPress={handleNewChat}>
        <Ionicons
          name="add-circle-outline"
          size={44}
          color="white"
        />
      </TouchableOpacity>
    </View>
  )
}
