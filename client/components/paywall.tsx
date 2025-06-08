import { AuthContext } from '@/context/auth-context'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useCallback, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import fetch from '../utils/fetch'
import { useStripe } from '@stripe/stripe-react-native'

interface PaywallModalProps {
  onSubscriptionComplete?: () => void
  hideClose?: boolean
}

export default function PaywallModal({ onSubscriptionComplete, hideClose }: PaywallModalProps) {
  const { session } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')

  const handleMonthlyWithTrial = useCallback(async () => {
    await handlePurchase('monthly')
  }, [])

  const handlePurchase = useCallback(
    async (period: 'monthly' | 'yearly') => {
      try {
        setLoading(true)
        const hasActiveSubscription = await fetch.post<{ status: string }>('/api/stripe/check-subscription')
        if (hasActiveSubscription) {
          alert('You already have an active subscription.')
          onSubscriptionComplete?.()
          return
        }
        const res = await fetch.post<{ customer: string; ephemeralKey: string; setupIntentClientSecret: string; clientSecret: string; hasTrial: boolean }>('/api/stripe/sheet', { period })

        const initConfig = {
          merchantDisplayName: 'AI Journal',
          customerId: res.customer,
          customerEphemeralKeySecret: res.ephemeralKey,
          allowsDelayedPaymentMethods: true,
          paymentMethodOrder: ['card', 'applePay', 'googlePay'],
          defaultBillingDetails: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          returnURL: Linking.createURL('stripe-redirect'),
        }

        if (res.hasTrial) {
          const { error: initError } = await initPaymentSheet({
            ...initConfig,
            setupIntentClientSecret: res.setupIntentClientSecret,
          })
          console.log('initError 1', initError)
          if (initError) {
            console.log(initError)
            alert('Purchase failed. Please try again.')
            return
          }
        } else {
          const { error: initError } = await initPaymentSheet({
            ...initConfig,
            paymentIntentClientSecret: res.clientSecret,
          })
          console.log('initError', initError)
          if (initError) {
            console.log(initError)
            alert('Purchase failed. Please try again.')
            return
          }
        }
        const { error: presentError } = await presentPaymentSheet()
        if (!presentError) {
          onSubscriptionComplete?.()
        }
      } catch (error) {
        alert('Purchase failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [session, initPaymentSheet, presentPaymentSheet, onSubscriptionComplete]
  )

  return (
    <View className="flex-1 bg-gray-50">
      {!hideClose && (
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 right-6 z-10 bg-white rounded-full p-2 shadow-md">
          <Ionicons
            name="close"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-20 pb-8">
          {/* Welcome Section */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons
                name="sparkles"
                size={40}
                color="white"
              />
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-3 text-center">Welcome to AI Journal</Text>
          </View>

          {/* Simple Value Proposition */}
          <View className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
            <Text className="text-gray-700 text-center text-lg leading-relaxed">
              Your personal AI companion for meaningful conversations and insights. Write freely, get thoughtful responses, and grow with every interaction.
            </Text>
          </View>

          {/* Pricing Plans */}
          <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">Choose Your Plan</Text>

          <View className="flex flex-col gap-4 mb-8">
            {/* Monthly Plan with Free Trial */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('monthly')}
              className={`bg-emerald-500 rounded-2xl p-6 shadow-sm border ${selectedPlan === 'monthly' ? 'border-emerald-600 shadow-lg' : 'border-emerald-400'}`}>
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-white text-xl font-bold">Monthly Plan</Text>
                  <Text className="text-emerald-100">3 days free trial included</Text>
                </View>
                <View className="bg-white rounded-full px-3 py-1">
                  <Text className="text-emerald-600 font-bold">$9.99</Text>
                </View>
              </View>
              <Text className="text-white text-lg font-semibold">$9.99/month after 3-day trial</Text>
              <Text className="text-emerald-100 text-sm mt-1">Cancel anytime during trial</Text>
            </TouchableOpacity>

            {/* Yearly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('yearly')}
              className={`bg-blue-600 rounded-2xl p-6 shadow-sm border relative ${selectedPlan === 'yearly' ? 'border-blue-700 shadow-lg' : 'border-blue-500'}`}>
              <View className="absolute -top-3 -right-3 bg-orange-500 rounded-full px-3 py-1 shadow-sm">
                <Text className="text-white text-xs font-bold">BEST VALUE</Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-white text-xl font-bold">Yearly</Text>
                  <Text className="text-blue-100">Save 17%</Text>
                </View>
                <View className="bg-white rounded-full px-3 py-1">
                  <Text className="text-blue-600 font-bold">$99</Text>
                </View>
              </View>
              <Text className="text-white text-lg font-semibold">$99 per year</Text>
              <Text className="text-blue-100 text-sm mt-1">$8.25/month when billed annually</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            {selectedPlan === 'monthly' && (
              <TouchableOpacity
                disabled={loading}
                onPress={handleMonthlyWithTrial}
                className="bg-emerald-500 py-4 rounded-xl shadow-sm">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Start 3-Day Free Trial</Text>}
              </TouchableOpacity>
            )}

            {selectedPlan === 'yearly' && (
              <TouchableOpacity
                disabled={loading}
                onPress={() => handlePurchase('yearly')}
                className="bg-blue-600 py-4 rounded-xl shadow-sm">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Subscribe Yearly - $99</Text>}
              </TouchableOpacity>
            )}

            {!hideClose && (
              <TouchableOpacity
                onPress={() => router.back()}
                className="py-4">
                <Text className="text-gray-500 text-center font-medium">Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View className="mt-8 pt-6 border-t border-gray-200">
            <Text className="text-gray-400 text-center text-sm">Secure payment • Cancel anytime • 30-day money back guarantee</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
