import { authClient } from '../../../utils/auth-client'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { AuthContext } from '../../../context/auth-context'
import fetch from '../../../utils/fetch'

type BioInfo = {
  id: string
  name: string
  email: string
  paid: boolean
  emailVerified: boolean
  image: string
  bio: string
  createdAt: Date
  updatedAt: Date
  stripeCustomerId: string
}

export default function SettingsScreen() {
  const [bio, setBio] = useState<string>('')
  const { isPending, session } = useContext(AuthContext)
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: updateBio } = useMutation({
    mutationFn: async () => {
      const response = await fetch.post('/api/bio', { bio })
      return response.json()
    },
    onMutate: () => {
      setIsUpdating(true)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', session?.user?.id] })
      Alert.alert('Bio updated successfully')
      setIsUpdating(false)
    },
    onError: () => {
      Alert.alert('Failed to update bio')
      setIsUpdating(false)
    },
  })

  const { data: userInfo } = useQuery<BioInfo>({
    queryKey: ['user', session?.user?.id],
    queryFn: async () => {
      const response = await fetch.get('/api/bio')
      return response.json()
    },
  })

  useEffect(() => {
    setBio(userInfo?.bio || '')
  }, [userInfo])

  const handleLogout = () => {
    authClient.signOut()
    router.replace('/login')
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="space-y-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center">
            <View className="relative mb-4">
              <View className="h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                <Image
                  source={{ uri: 'https://k2v5aihjnd.ufs.sh/f/YlnYmwr2DbqpCOaWTMJehciXUYO3AmZ6joRvGf18gNnDQBHy' }}
                  className="h-full w-full"
                />
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">{session?.user?.name}</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="mail"
                size={16}
                color="#6B7280"
              />
              <Text className="text-gray-500">{session?.user?.email}</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">Information</Text>
          </View>

          <View>
            <View className="px-4 py-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Tell us about yourself</Text>
              <Text className="text-sm font-medium text-gray-700 mb-2">This will be used to personalize your experience and help us understand your needs.</Text>
              <TextInput
                value={bio}
                onChangeText={text => setBio(text)}
                multiline
                numberOfLines={4}
                className="bg-gray-50 rounded-xl px-4 py-3 text-base min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-sm overflow-hidden p-4 flex flex-col gap-4">
            <TouchableOpacity
              onPress={() => updateBio()}
              className="w-full bg-blue-500 py-4 rounded-xl items-center"
              disabled={isPending}>
              {!isUpdating ? (
                <Text className="text-white font-medium">Save Bio</Text>
              ) : (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings/subscription')}
              className="w-full bg-green-500 py-4 rounded-xl items-center">
              <Text className="text-white font-medium">Subscription</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full bg-red-500 py-4 rounded-xl items-center"
              onPress={handleLogout}>
              <Text className="text-white text-base font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
