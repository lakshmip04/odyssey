import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { 
  mockSignIn, 
  mockSignUp, 
  mockSignOut, 
  mockGetSession,
  type MockUser 
} from '../lib/mockAuth'

interface AuthContextType {
  user: (User | MockUser) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: { name?: string; country?: string; dob?: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<(User | MockUser) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      if (isSupabaseConfigured) {
        // Use Supabase authentication
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.error('Error getting session:', error)
            setLoading(false)
            return
          }
          setUser(session?.user ?? null)
          setLoading(false)

          // Listen for changes on auth state
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
          })

          return () => {
            if (subscription) {
              subscription.unsubscribe()
            }
          }
        } catch (error) {
          console.error('Error in getSession:', error)
          setLoading(false)
        }
      } else {
        // Use mock authentication
        try {
          const mockUser = await mockGetSession()
          setUser(mockUser)
        } catch (error) {
          console.error('Error getting mock session:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // User state will be updated via onAuthStateChange listener
    } else {
      // Use mock authentication
      try {
        const mockUser = await mockSignIn(email, password)
        setUser(mockUser)
      } catch (error) {
        throw error
      }
    }
  }

  const signUp = async (email: string, password: string, userData?: { name?: string; country?: string; dob?: string }) => {
    if (isSupabaseConfigured) {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      // If user data is provided and signup was successful, store it in profiles table
      if (userData && authData.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: email,
              name: userData.name || null,
              country: userData.country || null,
              dob: userData.dob || null,
            })

          if (profileError) {
            // If profiles table doesn't exist or there's an error, try storing in user metadata as fallback
            console.warn('Could not save to profiles table:', profileError)
            // Update user metadata as fallback
            const { error: metadataError } = await supabase.auth.updateUser({
              data: {
                name: userData.name,
                country: userData.country,
                dob: userData.dob,
              }
            })
            if (metadataError) {
              console.warn('Could not save to user metadata:', metadataError)
            }
          }
        } catch (error) {
          // Log error but don't fail signup if profile creation fails
          console.error('Error creating user profile:', error)
        }
      }
      // User state will be updated via onAuthStateChange listener
    } else {
      // Use mock authentication
      try {
        const mockUser = await mockSignUp(email, password, userData)
        setUser(mockUser)
      } catch (error) {
        throw error
      }
    }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // User state will be updated via onAuthStateChange listener
    } else {
      // Use mock authentication
      try {
        await mockSignOut()
        setUser(null)
      } catch (error) {
        throw error
      }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

