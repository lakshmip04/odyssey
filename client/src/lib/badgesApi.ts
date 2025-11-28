import { supabase } from './supabaseClient'
import { getUserJournalEntries } from './travelJournalApi'
import { getAllCommunityDiscoveries } from './communityDiscoveriesApi'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  maxProgress: number
  badgeType: string
  badgeConfig?: any
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  progress: number
  unlocked: boolean
  unlocked_at: string | null
  badge?: Badge
}

// Get all available badges
export async function getAllBadges(): Promise<Badge[]> {
  const { data: badges, error } = await supabase
    .from('badges')
    .select('*')
    .order('rarity', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch badges: ${error.message}`)
  }

  return (badges || []).map(badge => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    rarity: badge.rarity,
    maxProgress: badge.max_progress,
    badgeType: badge.badge_type,
    badgeConfig: badge.badge_config,
  }))
}

// Get user badges with progress
export async function getUserBadges(): Promise<UserBadge[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: userBadges, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .order('unlocked', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch user badges: ${error.message}`)
  }

  return (userBadges || []).map(ub => ({
    id: ub.id,
    user_id: ub.user_id,
    badge_id: ub.badge_id,
    progress: ub.progress,
    unlocked: ub.unlocked,
    unlocked_at: ub.unlocked_at,
    badge: ub.badge ? {
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      rarity: ub.badge.rarity,
      maxProgress: ub.badge.max_progress,
      badgeType: ub.badge.badge_type,
      badgeConfig: ub.badge.badge_config,
    } : undefined,
  }))
}

// Get user badges with all badge details (for passport page)
export async function getUserBadgesWithDetails(): Promise<Array<Badge & { progress: number; unlocked: boolean; unlockedAt?: Date }>> {
  const badges = await getAllBadges()
  const userBadges = await getUserBadges()

  const userBadgeMap = new Map(userBadges.map(ub => [ub.badge_id, ub]))

  return badges.map(badge => {
    const userBadge = userBadgeMap.get(badge.id)
    return {
      ...badge,
      progress: userBadge?.progress || 0,
      unlocked: userBadge?.unlocked || false,
      unlockedAt: userBadge?.unlocked_at ? new Date(userBadge.unlocked_at) : undefined,
    }
  })
}

// Update or create user badge progress
export async function updateUserBadgeProgress(
  badgeId: string,
  progress: number,
  unlocked: boolean = false
): Promise<UserBadge> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user badge exists
  const { data: existing } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .eq('badge_id', badgeId)
    .single()

  const badgeData: any = {
    user_id: user.id,
    badge_id: badgeId,
    progress: Math.min(progress, 999999), // Cap progress
    unlocked: unlocked,
  }

  if (unlocked && !existing?.unlocked_at) {
    badgeData.unlocked_at = new Date().toISOString()
  }

  let result
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_badges')
      .update(badgeData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update badge: ${error.message}`)
    }
    result = data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_badges')
      .insert(badgeData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create badge: ${error.message}`)
    }
    result = data
  }

  return {
    id: result.id,
    user_id: result.user_id,
    badge_id: result.badge_id,
    progress: result.progress,
    unlocked: result.unlocked,
    unlocked_at: result.unlocked_at,
  }
}

// Calculate and update all badges for a user
export async function checkAndUpdateAllBadges(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get all badges
  const badges = await getAllBadges()

  // Get user data for calculations
  const journalEntries = await getUserJournalEntries()
  const communityDiscoveries = await getAllCommunityDiscoveries()
  const userDiscoveries = communityDiscoveries.filter(d => d.user_id === user.id)

  // Calculate metrics
  const decipheredCount = journalEntries.filter(e => e.ai_translations).length
  const visitedCount = journalEntries.length
  
  // Get unique languages from journal entries
  const languages = new Set<string>()
  journalEntries.forEach(entry => {
    if (entry.ai_translations && typeof entry.ai_translations === 'object') {
      const lang = (entry.ai_translations as any).language
      if (lang) languages.add(lang)
    }
  })
  const languageCount = languages.size

  // Count Ashokan edicts (entries with "ashokan" or "edict" in name/description)
  const ashokanCount = journalEntries.filter(entry => {
    const name = entry.site_name?.toLowerCase() || ''
    const notes = entry.notes?.toLowerCase() || ''
    return name.includes('ashokan') || name.includes('edict') || notes.includes('ashokan') || notes.includes('edict')
  }).length

  // Count video generations (discoveries with video_url)
  const videoCount = userDiscoveries.filter(d => d.video_url).length

  // Count total likes on user's discoveries
  const totalLikes = userDiscoveries.reduce((sum, d) => sum + d.likes, 0)

  // Count unique countries
  const countries = new Set<string>()
  journalEntries.forEach(entry => {
    if (entry.country) countries.add(entry.country)
  })
  const countryCount = countries.size

  // Update each badge
  for (const badge of badges) {
    let progress = 0
    let unlocked = false

    switch (badge.badgeType) {
      case 'decipher_count':
        progress = decipheredCount
        unlocked = progress >= badge.maxProgress
        break
      case 'visit_count':
        progress = visitedCount
        unlocked = progress >= badge.maxProgress
        break
      case 'language_count':
        progress = languageCount
        unlocked = progress >= badge.maxProgress
        break
      case 'ashokan_count':
        progress = ashokanCount
        unlocked = progress >= badge.maxProgress
        break
      case 'video_count':
        progress = videoCount
        unlocked = progress >= badge.maxProgress
        break
      case 'likes_count':
        progress = totalLikes
        unlocked = progress >= badge.maxProgress
        break
      case 'country_count':
        progress = countryCount
        unlocked = progress >= badge.maxProgress
        break
    }

    await updateUserBadgeProgress(badge.id, progress, unlocked)
  }
}

