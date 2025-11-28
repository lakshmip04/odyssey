import { supabase } from './supabaseClient'

export interface CommunityDiscovery {
  id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  type: 'discovery' | 'post'
  site_name: string
  location?: string
  location_lat?: number
  location_lng?: number
  original_text?: string
  translated_text?: string
  description?: string
  image_url?: string
  video_url?: string
  likes: number
  is_liked: boolean
  learned_count: number
  is_learned: boolean
  created_at: string
  updated_at: string
}

export interface CreateDiscoveryInput {
  type: 'discovery' | 'post'
  site_name: string
  location?: string
  location_lat?: number
  location_lng?: number
  original_text?: string
  translated_text?: string
  description?: string
  image_url?: string
  video_url?: string
}

// Create a new community discovery
export async function createCommunityDiscovery(
  input: CreateDiscoveryInput
): Promise<CommunityDiscovery> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: discovery, error } = await supabase
    .from('community_discoveries')
    .insert({
      user_id: user.id,
      type: input.type,
      site_name: input.site_name,
      location: input.location || null,
      location_lat: input.location_lat || null,
      location_lng: input.location_lng || null,
      original_text: input.original_text || null,
      translated_text: input.translated_text || null,
      description: input.description || null,
      image_url: input.image_url || null,
      video_url: input.video_url || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create discovery: ${error.message}`)
  }

  // Fetch with user profile and counts
  return await getCommunityDiscovery(discovery.id)
}

// Get a single discovery with user info and counts
export async function getCommunityDiscovery(discoveryId: string): Promise<CommunityDiscovery> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  // Get discovery
  const { data: discovery, error } = await supabase
    .from('community_discoveries')
    .select('*')
    .eq('id', discoveryId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch discovery: ${error.message}`)
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', discovery.user_id)
    .single()

  // Get likes count and check if current user liked it
  const { data: likes, count: likesCount } = await supabase
    .from('community_discovery_likes')
    .select('*', { count: 'exact' })
    .eq('discovery_id', discoveryId)

  const isLiked = currentUserId 
    ? likes?.some(like => like.user_id === currentUserId) || false
    : false

  // Get learned count and check if current user learned it
  const { data: learned, count: learnedCount } = await supabase
    .from('community_discovery_learned')
    .select('*', { count: 'exact' })
    .eq('discovery_id', discoveryId)

  const isLearned = currentUserId
    ? learned?.some(l => l.user_id === currentUserId) || false
    : false

  return {
    ...discovery,
    user_name: profile?.name || profile?.email?.split('@')[0] || 'Anonymous',
    likes: likesCount || 0,
    is_liked: isLiked,
    learned_count: learnedCount || 0,
    is_learned: isLearned,
  }
}

// Get all community discoveries
export async function getAllCommunityDiscoveries(): Promise<CommunityDiscovery[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  // Get all discoveries
  const { data: discoveries, error } = await supabase
    .from('community_discoveries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch discoveries: ${error.message}`)
  }

  if (!discoveries || discoveries.length === 0) {
    return []
  }

  // Get user profiles for all discoveries
  const userIds = [...new Set(discoveries.map(d => d.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Get all likes and learned for current user
  const discoveryIds = discoveries.map(d => d.id)
  
  const { data: allLikes } = await supabase
    .from('community_discovery_likes')
    .select('discovery_id, user_id')
    .in('discovery_id', discoveryIds)

  const { data: allLearned } = await supabase
    .from('community_discovery_learned')
    .select('discovery_id, user_id')
    .in('discovery_id', discoveryIds)

  // Count likes and learned per discovery
  const likesMap = new Map<string, number>()
  const learnedMap = new Map<string, number>()
  const userLikesSet = new Set<string>()
  const userLearnedSet = new Set<string>()

  allLikes?.forEach(like => {
    const count = likesMap.get(like.discovery_id) || 0
    likesMap.set(like.discovery_id, count + 1)
    if (currentUserId && like.user_id === currentUserId) {
      userLikesSet.add(like.discovery_id)
    }
  })

  allLearned?.forEach(learned => {
    const count = learnedMap.get(learned.discovery_id) || 0
    learnedMap.set(learned.discovery_id, count + 1)
    if (currentUserId && learned.user_id === currentUserId) {
      userLearnedSet.add(learned.discovery_id)
    }
  })

  // Combine everything
  return discoveries.map(discovery => {
    const profile = profileMap.get(discovery.user_id)
    return {
      ...discovery,
      user_name: profile?.name || profile?.email?.split('@')[0] || 'Anonymous',
      likes: likesMap.get(discovery.id) || 0,
      is_liked: userLikesSet.has(discovery.id),
      learned_count: learnedMap.get(discovery.id) || 0,
      is_learned: userLearnedSet.has(discovery.id),
    }
  })
}

// Like a discovery
export async function likeDiscovery(discoveryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('community_discovery_likes')
    .insert({
      discovery_id: discoveryId,
      user_id: user.id,
    })

  if (error) {
    // If already liked, ignore the error (idempotent)
    if (error.code !== '23505') { // Unique constraint violation
      throw new Error(`Failed to like discovery: ${error.message}`)
    }
  }
}

// Unlike a discovery
export async function unlikeDiscovery(discoveryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('community_discovery_likes')
    .delete()
    .eq('discovery_id', discoveryId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to unlike discovery: ${error.message}`)
  }
}

// Mark discovery as learned
export async function markDiscoveryAsLearned(discoveryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('community_discovery_learned')
    .insert({
      discovery_id: discoveryId,
      user_id: user.id,
    })

  if (error) {
    // If already learned, ignore the error (idempotent)
    if (error.code !== '23505') { // Unique constraint violation
      throw new Error(`Failed to mark discovery as learned: ${error.message}`)
    }
  }
}

// Unmark discovery as learned
export async function unmarkDiscoveryAsLearned(discoveryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('community_discovery_learned')
    .delete()
    .eq('discovery_id', discoveryId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to unmark discovery as learned: ${error.message}`)
  }
}

