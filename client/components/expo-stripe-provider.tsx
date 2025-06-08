import { StripeProvider } from '@stripe/stripe-react-native'
import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import React from 'react'

const merchantId = Constants.expoConfig?.plugins?.find(p => p[0] === '@stripe/stripe-react-native')?.[1].merchantIdentifier

if (!merchantId) {
  throw new Error('Missing Expo config for "@stripe/stripe-react-native"')
}
export default function ExpoStripeProvider(props: Omit<React.ComponentProps<typeof StripeProvider>, 'publishableKey' | 'merchantIdentifier'>) {
  return (
    <StripeProvider
      publishableKey={'pk_test_51RSLCpPW6ilRA0XQlg7zGAsKkXIeQwOZJquqhj9HIB6XyZ1Nww31rN31LfPyV2NULJ3xSx3qWrX5vCzVcsANYVfs00d1FQWH8D'}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL('/').split(':')[0]}
      {...props}
    />
  )
}
