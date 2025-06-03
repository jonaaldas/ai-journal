import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useContext } from 'react'
import { ChatContext } from '../../context/chat-context'

export default function Index() {
  const { chats, handleNewChat } = useContext(ChatContext)

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatList}>
        {chats.length === 0 ? (
          <Text>No chats yet</Text>
        ) : (
          chats.map(chat => (
            <TouchableOpacity
              key={chat.conversation.id}
              onPress={() => router.push(`/chat/${chat.conversation.id}`)}
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <View style={{ marginRight: 12 }}>
                <Ionicons
                  name="chatbubble-outline"
                  size={24}
                  color="#666"
                />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>{chat.conversation.title}</Text>
                <Text
                  style={{ color: '#666', fontSize: 14 }}
                  numberOfLines={1}>
                  {chat.messages[0]?.content || 'No messages yet'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity
        onPress={handleNewChat}
        style={styles.newChatButton}>
        <Ionicons
          name="add-circle"
          size={64}
          color="white"
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  newChatButton: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 40,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'blue',
  },
  chatList: {
    flex: 1,
    padding: 20,
  },
})
