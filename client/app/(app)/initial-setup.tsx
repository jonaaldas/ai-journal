import { View, Text, Image, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import fetch from '../../utils/fetch'

export default function InitialSetup() {
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (userInput.trim()) {
      setIsLoading(true)
      try {
        await fetch.post('/api/bio', { bio: userInput.trim() })
        router.replace('/')
      } catch (error) {
        Alert.alert('Error', 'Failed to save your information. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      Alert.alert('Please enter something', 'Tell us what you need to work on so we can help you better.')
    }
  }

  const handleSkip = async () => {
    router.replace('/')
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header with close button */}
      <View className="flex-row justify-end p-4 pt-12">
        <TouchableOpacity
          onPress={handleSkip}
          className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
          <Ionicons
            name="close"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-sm">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center' }}
            className="w-full h-48 rounded-2xl mb-8"
            resizeMode="cover"
          />
        </View>
      </View>

      <View className="flex-1 px-6 py-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">Welcome to AI Journal</Text>
          <Text className="text-lg text-gray-600 text-center leading-relaxed">Please tell us what you need to work on in order for us to give you better answers</Text>
        </View>

        <View className="mb-8">
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 min-h-[120px]"
            placeholder="I want to work on my productivity, relationships, health goals..."
            value={userInput}
            onChangeText={setUserInput}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={{ fontFamily: 'System' }}
          />
        </View>

        <View className="space-y-4 flex flex-col gap-4">
          <TouchableOpacity
            className={`bg-blue-600 rounded-xl py-4 px-6 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={isLoading}>
            <Text className="text-white text-center text-lg font-semibold">{isLoading ? 'Getting Started...' : 'Get Started'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-4 px-6"
            onPress={handleSkip}
            disabled={isLoading}>
            <Text className="text-gray-600 text-center text-lg font-medium">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
