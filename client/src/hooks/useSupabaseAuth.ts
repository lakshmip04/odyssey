import { useAuth } from '../context/AuthContext'

export const useSupabaseAuth = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth()

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }
}

