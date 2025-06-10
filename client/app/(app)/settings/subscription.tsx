import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Card } from '../../../components/ui/card'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { AuthContext } from '../../../context/auth-context'
import fetch from '../../../utils/fetch'
import { format } from 'date-fns'

type Subscription = {
  subscriptionId: string
  status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'canceled' | 'unpaid'
  priceId: string
  currentPeriodEnd: number
  currentPeriodStart: number
  cancelAtPeriodEnd: boolean
  paymentMethod: string | null
}

const subscriptionPlans = [
  {
    id: 'monthly',
    name: 'Monthly Subscription',
    price: 9.99,
    interval: 'month',
    features: ['Unlimited chats', 'Priority support', 'Advanced features', 'No ads'],
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly Subscription',
    price: 99,
    interval: 'year',
    features: ['All Monthly features', '2 months free', 'Early access to new features', 'Custom chat themes'],
    popular: true,
  },
]

export default function SubscriptionScreen() {
  const { session } = useContext(AuthContext)
  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['stripe', 'subscription', session?.user?.id],
    queryFn: async () => {
      const response = await fetch.get('/api/stripe/subscription')
      return response.json()
    },
  })

  const handleManageSubscription = async () => {
    Alert.alert('Stripe Portal', 'Opening Stripe customer portal...')
  }

  const getStatusBadgeColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial Period'
      case 'past_due':
        return 'Payment Past Due'
      case 'canceled':
        return 'Canceled'
      default:
        return 'Inactive'
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading subscription details...</Text>
      </View>
    )
  }

  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const isTrialing = subscription.status === 'trialing'
    const periodEnd = format(new Date(subscription.currentPeriodEnd * 1000), 'MMMM d, yyyy')
    const statusColor = getStatusBadgeColor(subscription.status)

    return (
      <View className="flex-1 p-4 bg-gray-50">
        <Card className="p-6 mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-xl font-bold">Current Subscription</Text>
            <View className={`px-3 py-1 rounded-full ${statusColor}`}>
              <Text className="text-sm font-medium">{getStatusText(subscription.status)}</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-600 mb-2">
              {isTrialing ? 'Trial ends' : 'Next billing date'}: {periodEnd}
            </Text>
            {subscription.cancelAtPeriodEnd && (
              <View className="bg-yellow-50 p-3 rounded-lg mt-2">
                <Text className="text-yellow-800">Your subscription will end on {periodEnd}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleManageSubscription}
            className="bg-blue-500 rounded-lg py-3 px-4">
            <Text className="text-white text-center font-semibold">Manage Subscription</Text>
          </TouchableOpacity>
        </Card>

        <View className="bg-gray-100 p-4 rounded-lg">
          <Text className="text-sm text-gray-600 text-center">
            {isTrialing ? 'Enjoying your trial? Keep your subscription active to continue accessing all features.' : 'Thank you for being a valued subscriber!'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-2 text-center">Choose Your Plan</Text>
      <Text className="text-gray-600 text-center mb-6">Select a plan to unlock all features</Text>

      {subscriptionPlans.map(plan => (
        <Card
          key={plan.id}
          className={`p-6 mb-4 ${plan.popular ? 'border-2 border-blue-500' : ''}`}>
          {plan.popular && (
            <View className="absolute -top-3 right-4 bg-blue-500 px-3 py-1 rounded-full">
              <Text className="text-white text-sm">Best Value</Text>
            </View>
          )}
          <Text className="text-xl font-bold mb-2">{plan.name}</Text>
          <View className="flex-row items-baseline mb-4">
            <Text className="text-3xl font-bold">${plan.price}</Text>
            <Text className="text-gray-600 ml-1">/{plan.interval}</Text>
          </View>
          <View className="mb-6">
            {plan.features.map((feature, index) => (
              <View
                key={index}
                className="flex-row items-center mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#2563eb"
                />
                <Text className="ml-2 text-gray-700">{feature}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-3"
            onPress={() => console.log(`Selected ${plan.name}`)}>
            <Text className="text-white text-center font-semibold">Select Plan</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </View>
  )
}
