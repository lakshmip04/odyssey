import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseKey !== 'placeholder-key')

// Create Supabase client
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key')

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials not found. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export { supabase }
export default supabase

