import { supabase } from './supabaseClient'
import { HeritageSite } from './placesApi'

export interface Itinerary {
  id: string
  user_id: string
  name: string
  location: string
  country?: string
  state?: string
  start_date?: string
  end_date?: string
  description?: string
  is_smart_planned: boolean
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
  items?: ItineraryItem[]
}

export interface ItineraryItem {
  id: string
  itinerary_id: string
  site_id: string
  site_name: string
  site_description?: string
  site_address?: string
  site_category?: string
  site_heritage_type?: string
  site_rating?: number
  location_lat: number
  location_lng: number
  order_index: number
  visit_date?: string
  visit_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateItineraryInput {
  name: string
  location: string
  country?: string
  state?: string
  start_date?: string
  end_date?: string
  description?: string
  is_smart_planned?: boolean
  items: HeritageSite[]
}

// Create a new itinerary with items
export async function createItinerary(
  input: CreateItineraryInput
): Promise<Itinerary> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create itinerary - build data object with only required fields first
  const itineraryData: Record<string, any> = {
    user_id: user.id,
    name: input.name,
    location: input.location,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    description: input.description || null,
    is_smart_planned: input.is_smart_planned || false,
  }

  // Try to add optional fields (they may not exist in schema yet)
  // If they don't exist, Supabase will ignore them
  try {
    if (input.country !== undefined) {
      itineraryData.country = input.country || null
    }
    if (input.state !== undefined) {
      itineraryData.state = input.state || null
    }
    itineraryData.is_completed = false
  } catch (e) {
    // Ignore if columns don't exist - will be added via migration
    console.warn('Optional itinerary fields not available:', e)
  }

  const { data: itinerary, error: itineraryError } = await supabase
    .from('itineraries')
    .insert(itineraryData)
    .select()
    .single()

  if (itineraryError) {
    throw new Error(`Failed to create itinerary: ${itineraryError.message}`)
  }

  // Create itinerary items
  if (input.items.length > 0) {
    const items = input.items.map((site, index) => ({
      itinerary_id: itinerary.id,
      site_id: site.id,
      site_name: site.name,
      site_description: site.description || null,
      site_address: site.address || null,
      site_category: site.category || null,
      site_heritage_type: site.heritageType || null,
      site_rating: site.rating || null,
      location_lat: site.location.lat,
      location_lng: site.location.lng,
      order_index: index,
    }))

    const { error: itemsError } = await supabase
      .from('itinerary_items')
      .insert(items)

    if (itemsError) {
      // Delete itinerary if items insertion fails
      await supabase.from('itineraries').delete().eq('id', itinerary.id)
      throw new Error(`Failed to create itinerary items: ${itemsError.message}`)
    }
  }

  // Fetch the complete itinerary with items
  return getItinerary(itinerary.id)
}

// Get a single itinerary with items
export async function getItinerary(itineraryId: string): Promise<Itinerary> {
  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', itineraryId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch itinerary: ${error.message}`)
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('order_index', { ascending: true })

  if (itemsError) {
    throw new Error(`Failed to fetch itinerary items: ${itemsError.message}`)
  }

  return {
    ...itinerary,
    items: items || [],
  }
}

// Get all itineraries for the current user
export async function getUserItineraries(): Promise<Itinerary[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: itineraries, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch itineraries: ${error.message}`)
  }

  // Fetch items for each itinerary
  const itinerariesWithItems = await Promise.all(
    (itineraries || []).map(async (itinerary) => {
      const { data: items } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('itinerary_id', itinerary.id)
        .order('order_index', { ascending: true })

      return {
        ...itinerary,
        items: items || [],
      }
    })
  )

  return itinerariesWithItems
}

// Update an itinerary
export async function updateItinerary(
  itineraryId: string,
  updates: Partial<Pick<Itinerary, 'name' | 'location' | 'start_date' | 'end_date' | 'description'>>
): Promise<Itinerary> {
  const { error } = await supabase
    .from('itineraries')
    .update(updates)
    .eq('id', itineraryId)

  if (error) {
    throw new Error(`Failed to update itinerary: ${error.message}`)
  }

  return getItinerary(itineraryId)
}

// Update itinerary items (replace all items)
export async function updateItineraryItems(
  itineraryId: string,
  items: HeritageSite[]
): Promise<void> {
  // Delete existing items
  const { error: deleteError } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('itinerary_id', itineraryId)

  if (deleteError) {
    throw new Error(`Failed to delete existing items: ${deleteError.message}`)
  }

  // Insert new items
  if (items.length > 0) {
    const newItems = items.map((site, index) => ({
      itinerary_id: itineraryId,
      site_id: site.id,
      site_name: site.name,
      site_description: site.description || null,
      site_address: site.address || null,
      site_category: site.category || null,
      site_heritage_type: site.heritageType || null,
      site_rating: site.rating || null,
      location_lat: site.location.lat,
      location_lng: site.location.lng,
      order_index: index,
    }))

    const { error: insertError } = await supabase
      .from('itinerary_items')
      .insert(newItems)

    if (insertError) {
      throw new Error(`Failed to insert items: ${insertError.message}`)
    }
  }
}

// Mark itinerary as completed and create travel journal entries
export async function markItineraryCompleted(itineraryId: string): Promise<Itinerary> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get the itinerary with items
  const itinerary = await getItinerary(itineraryId)

  if (!itinerary) {
    throw new Error('Itinerary not found')
  }

  // Update itinerary as completed
  const { error: updateError } = await supabase
    .from('itineraries')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', itineraryId)

  if (updateError) {
    throw new Error(`Failed to mark itinerary as completed: ${updateError.message}`)
  }

  // Create travel journal entries for all sites
  if (itinerary.items && itinerary.items.length > 0) {
    const { createJournalEntry } = await import('./travelJournalApi')
    
    for (const item of itinerary.items) {
      try {
        await createJournalEntry({
          site_id: item.site_id,
          site_name: item.site_name,
          location_lat: item.location_lat,
          location_lng: item.location_lng,
          location_name: itinerary.location,
          country: itinerary.country || undefined,
          state: itinerary.state || undefined,
          notes: `Visited as part of: ${itinerary.name}`,
        })
      } catch (error) {
        console.error(`Failed to create journal entry for ${item.site_name}:`, error)
        // Continue with other entries even if one fails
      }
    }
  }
  
  // Refresh the itinerary to get updated status
  return getItinerary(itineraryId)
}

// Delete an itinerary
export async function deleteItinerary(itineraryId: string): Promise<void> {
  // Items will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', itineraryId)

  if (error) {
    throw new Error(`Failed to delete itinerary: ${error.message}`)
  }
}

// Smart plan itinerary - optimize route order
export function smartPlanItinerary(sites: HeritageSite[]): HeritageSite[] {
  if (sites.length <= 1) return sites

  // Simple nearest neighbor algorithm for route optimization
  const optimized: HeritageSite[] = []
  const remaining = [...sites]
  
  // Start with the first site
  let current = remaining.shift()!
  optimized.push(current)

  while (remaining.length > 0) {
    // Find the nearest unvisited site
    let nearestIndex = 0
    let nearestDistance = Infinity

    remaining.forEach((site, index) => {
      const distance = calculateDistance(
        current.location,
        site.location
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    current = remaining.splice(nearestIndex, 1)[0]
    optimized.push(current)
  }

  return optimized
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat)
  const dLon = toRad(point2.lng - point1.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

