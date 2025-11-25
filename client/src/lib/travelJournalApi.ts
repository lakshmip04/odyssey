import { supabase } from './supabaseClient'

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

  const { data: entry, error } = await supabase
    .from('travel_journal_entries')
    .insert({
      user_id: user.id,
      site_id: input.site_id || null,
      site_name: input.site_name,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_name: input.location_name || null,
      country: input.country || null,
      state: input.state || null,
      notes: input.notes || null,
      photos: input.photos || null,
      ai_translations: input.ai_translations || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create journal entry: ${error.message}`)
  }

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
  const { error } = await supabase
    .from('travel_journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update journal entry: ${error.message}`)
  }

  return {} as TravelJournalEntry // Will be populated by select
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

