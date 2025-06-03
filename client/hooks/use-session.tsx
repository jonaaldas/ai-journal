//make sure you're using the react client
import { createAuthClient } from 'better-auth/react'
const { useSession } = createAuthClient()

export function User() {
  const { data: session, isPending, error, refetch } = useSession()
  return {
    session,
    isPending,
    error,
    refetch,
  }
}
