import { useEffect, useState } from 'react'
import PaywallModal from '../../components/paywall'
import SetupBio from '@/components/setup-bio'
import { router } from 'expo-router'
import { AuthContext } from '@/context/auth-context'
import { useContext } from 'react'
import fetch from '@/utils/fetch'

export default function InitialSetup() {
  const [currentStep, setCurrentStep] = useState<'upgrade' | 'bio'>('upgrade')
  const { session } = useContext(AuthContext)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const hasActiveSubscriptionResponse = await fetch.post('/api/stripe/check-subscription')
      const hasActiveSubscription = await hasActiveSubscriptionResponse.json()
      if (hasActiveSubscription) {
        setCurrentStep('bio')
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscriptionComplete = () => {
    setCurrentStep('bio')
  }

  const handleBioComplete = () => {
    router.replace('/')
  }

  if (currentStep === 'upgrade') {
    return (
      <PaywallModal
        onSubscriptionComplete={handleSubscriptionComplete}
        hideClose
      />
    )
  }

  if (currentStep === 'bio') {
    return (
      <SetupBio
        onComplete={handleBioComplete}
        hideSkip
      />
    )
  }

  return null
}
