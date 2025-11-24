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
      // Sign up the user with metadata (this will be stored in auth.users.raw_user_meta_data)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData?.name || null,
            country: userData?.country || null,
            dob: userData?.dob || null,
          }
        }
      })
      if (authError) throw authError

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned')
      }

      console.log('✅ User created:', authData.user.id)
      console.log('User metadata:', authData.user.user_metadata)

      // Wait for the session to be established (important for RLS)
      // Check if we have a session
      let session = authData.session
      if (!session) {
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: { session: newSession } } = await supabase.auth.getSession()
        session = newSession
      }

      // Try to create/update profile
      // The trigger should handle this, but we'll also do it client-side as backup
      if (authData.user) {
        try {
          // Wait a moment for trigger to potentially run first
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const profileData = {
            id: authData.user.id,
            email: email,
            name: userData?.name || null,
            country: userData?.country || null,
            dob: userData?.dob || null,
          }

          console.log('Attempting to create profile:', profileData)
          console.log('Current session:', session ? 'Active' : 'No session')

          // Try insert first
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()

          if (insertError) {
            // If insert fails, try update (profile might exist from trigger)
            console.log('Insert failed, trying update:', insertError.message)
            console.log('Error code:', insertError.code)
            
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({
                email: email,
                name: userData?.name || null,
                country: userData?.country || null,
                dob: userData?.dob || null,
              })
              .eq('id', authData.user.id)
              .select()

            if (updateError) {
              console.error('❌ Profile creation/update failed:', updateError)
              console.error('Error details:', {
                message: updateError.message,
                code: updateError.code,
                details: updateError.details,
                hint: updateError.hint
              })
              // Check if profile exists (maybe trigger created it)
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single()
              
              if (existingProfile) {
                console.log('✅ Profile exists (created by trigger):', existingProfile)
              } else {
                console.warn('⚠️ Profile does not exist - trigger may not have run')
              }
            } else {
              console.log('✅ Profile updated successfully:', updateData)
            }
          } else {
            console.log('✅ Profile created successfully:', insertData)
          }
        } catch (error) {
          console.error('❌ Error creating user profile:', error)
          // Check if profile exists anyway
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()
          
          if (existingProfile) {
            console.log('✅ Profile exists (created by trigger):', existingProfile)
          }
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

