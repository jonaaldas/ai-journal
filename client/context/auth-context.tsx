import { createContext } from 'react'
import { authClient } from '../utils/auth-client'

export const AuthContext = createContext({
  session: null,
  isPending: true,
  error: null,
  refetch: () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending, error, refetch } = authClient.useSession()
  return <AuthContext.Provider value={{ session, isPending, error, refetch }}>{children}</AuthContext.Provider>
}
