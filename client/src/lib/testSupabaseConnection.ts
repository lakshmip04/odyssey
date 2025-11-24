import { supabase, isSupabaseConfigured } from './supabaseClient'

/**
 * Test Supabase connection and configuration
 * Run this function to verify your Supabase setup is working
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  console.log('📋 Configuration Check:')
  console.log('  - VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('  - VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  console.log('  - isSupabaseConfigured:', isSupabaseConfigured ? '✅ Yes' : '❌ No')
  console.log('')

  if (!isSupabaseConfigured) {
    console.error('❌ Supabase is not configured. Please check your .env file.')
    return false
  }

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔌 Test 1: Connection Test')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(0)

    if (healthError) {
      // If it's a table not found error, that's okay - connection works
      if (healthError.code === 'PGRST116' || healthError.message.includes('relation') || healthError.message.includes('does not exist')) {
        console.log('  ✅ Connection successful (table may not exist yet)')
      } else {
        console.log('  ⚠️  Connection issue:', healthError.message)
      }
    } else {
      console.log('  ✅ Connection successful')
    }
    console.log('')

    // Test 2: Check auth service
    console.log('🔐 Test 2: Auth Service Test')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('  ⚠️  Auth service check:', authError.message)
    } else {
      console.log('  ✅ Auth service accessible')
      console.log('  - Current session:', session ? 'Active' : 'No active session')
    }
    console.log('')

    // Test 3: Try to query profiles table (if it exists)
    console.log('📊 Test 3: Profiles Table Test')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('  ⚠️  Profiles table does not exist yet')
          console.log('  💡 Run the SQL from supabase_setup.sql in your Supabase dashboard')
        } else {
          console.log('  ❌ Error querying profiles:', error.message)
        }
      } else {
        console.log('  ✅ Profiles table exists and is accessible')
      }
    } catch (err) {
      console.log('  ⚠️  Could not query profiles table:', err instanceof Error ? err.message : 'Unknown error')
    }
    console.log('')

    console.log('✅ Connection test completed!')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  // Wait a bit for the app to initialize
  setTimeout(() => {
    testSupabaseConnection()
  }, 1000)
}

