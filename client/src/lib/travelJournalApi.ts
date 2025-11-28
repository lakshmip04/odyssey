import { supabase } from './supabaseClient'
import { reverseGeocode } from './reverseGeocode'

export interface TravelJournalEntry {
  id: string
  user_id: string
  site_id?: string
  site_name: string
  location_lat: number
  location_lng: number
  location_name?: string
  country?: string
  state?: string
  visited_at: string
  notes?: string
  photos?: string[]
  ai_translations?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateJournalEntryInput {
  site_id?: string
  site_name: string
  location_lat: number
  location_lng: number
  location_name?: string
  country?: string
  state?: string
  notes?: string
  photos?: string[]
  ai_translations?: Record<string, any>
}

// Create a new journal entry
export async function createJournalEntry(
  input: CreateJournalEntryInput
): Promise<TravelJournalEntry> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // If country or state is missing, use reverse geocoding to get them
  let country = input.country
  let state = input.state
  
  if (!country || !state) {
    try {
      const geocodeResult = await reverseGeocode(input.location_lat, input.location_lng)
      country = country || geocodeResult.country
      state = state || geocodeResult.state
      
      console.log(`Reverse geocoded for ${input.site_name}:`, { country, state })
    } catch (error) {
      console.warn(`Failed to reverse geocode for ${input.site_name}:`, error)
      // Continue without country/state if geocoding fails
    }
  }

  const { data: entry, error } = await supabase
    .from('travel_journal_entries')
    .insert({
      user_id: user.id,
      site_id: input.site_id || null,
      site_name: input.site_name,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_name: input.location_name || null,
      country: country || null,
      state: state || null,
      notes: input.notes || null,
      photos: input.photos || null,
      ai_translations: input.ai_translations || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create journal entry: ${error.message}`)
  }

  // Check and update badges asynchronously (don't block on this)
  import('../lib/badgesApi').then(({ checkAndUpdateAllBadges }) => {
    checkAndUpdateAllBadges().catch(err => {
      console.warn('Failed to update badges:', err)
    })
  })

  return entry
}

// Get all journal entries for the current user
export async function getUserJournalEntries(): Promise<TravelJournalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: entries, error } = await supabase
    .from('travel_journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('visited_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch journal entries: ${error.message}`)
  }

  return entries || []
}

// Get visited locations for Fog of War map
export async function getVisitedLocations(): Promise<Array<{
  lat: number
  lng: number
  name: string
  visitedAt: string
  country?: string
  state?: string
}>> {
  const entries = await getUserJournalEntries()
  
  return entries.map(entry => ({
    lat: entry.location_lat,
    lng: entry.location_lng,
    name: entry.site_name,
    visitedAt: entry.visited_at,
    country: entry.country || undefined,
    state: entry.state || undefined,
  }))
}

// Update a journal entry
export async function updateJournalEntry(
  entryId: string,
  updates: Partial<Pick<TravelJournalEntry, 'notes' | 'photos' | 'ai_translations'>>
): Promise<TravelJournalEntry> {
  const { data, error } = await supabase
    .from('travel_journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update journal entry: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from update')
  }

  return data
}

// Delete a journal entry
export async function deleteJournalEntry(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('travel_journal_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    throw new Error(`Failed to delete journal entry: ${error.message}`)
  }
}

// Update journal entries that are missing country/state information
export async function updateMissingLocationData(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get all entries missing country or state
  const { data: entries, error: fetchError } = await supabase
    .from('travel_journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .or('country.is.null,state.is.null')

  if (fetchError) {
    throw new Error(`Failed to fetch entries: ${fetchError.message}`)
  }

  if (!entries || entries.length === 0) {
    return 0
  }

  let updatedCount = 0

  // Update each entry with missing data
  for (const entry of entries) {
    try {
      const geocodeResult = await reverseGeocode(entry.location_lat, entry.location_lng)
      
      const updates: { country?: string; state?: string } = {}
      if (!entry.country && geocodeResult.country) {
        updates.country = geocodeResult.country
      }
      if (!entry.state && geocodeResult.state) {
        updates.state = geocodeResult.state
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('travel_journal_entries')
          .update(updates)
          .eq('id', entry.id)

        if (!updateError) {
          updatedCount++
          console.log(`Updated entry ${entry.site_name}:`, updates)
        } else {
          console.error(`Failed to update entry ${entry.id}:`, updateError)
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error updating entry ${entry.id}:`, error)
    }
  }

  return updatedCount
}

