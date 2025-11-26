import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeritagePassport from '../components/HeritagePassport'
import { getUserJournalEntries } from '../lib/travelJournalApi'
import type { Badge } from '../components/HeritagePassport'
import { Award } from 'lucide-react'
import { RetroGrid } from '../components/ui/retro-grid'

const HeritagePassportPage = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      loadBadges()
    }
  }, [isAuthenticated])

  const loadBadges = async () => {
    try {
      // Get user's journal entries to calculate badges
      const entries = await getUserJournalEntries()
      
      // Calculate badge progress based on user activity
      const decipheredCount = entries.filter(e => e.ai_translations).length
      const visitedCount = entries.length
      
      // Define badges
      const allBadges: Badge[] = [
        {
          id: 'first-discovery',
          name: 'First Discovery',
          description: 'Decipher your first monument inscription',
          icon: '🔍',
          unlocked: decipheredCount >= 1,
          progress: Math.min(decipheredCount, 1),
          maxProgress: 1,
          rarity: 'common',
          unlockedAt: decipheredCount >= 1 ? new Date() : undefined,
        },
        {
          id: 'mauryan-historian',
          name: 'Mauryan Historian',
          description: 'Translate 5 Ashokan Edicts',
          icon: '📜',
          unlocked: decipheredCount >= 5,
          progress: Math.min(decipheredCount, 5),
          maxProgress: 5,
          rarity: 'rare',
          unlockedAt: decipheredCount >= 5 ? new Date() : undefined,
        },
        {
          id: 'temple-explorer',
          name: 'Temple Explorer',
          description: 'Visit and decipher 10 temples',
          icon: '🛕',
          unlocked: visitedCount >= 10,
          progress: Math.min(visitedCount, 10),
          maxProgress: 10,
          rarity: 'rare',
          unlockedAt: visitedCount >= 10 ? new Date() : undefined,
        },
        {
          id: 'script-master',
          name: 'Script Master',
          description: 'Decipher inscriptions in 5 different languages',
          icon: '✍️',
          unlocked: false, // Would need to track languages
          progress: 0,
          maxProgress: 5,
          rarity: 'epic',
        },
        {
          id: 'heritage-scholar',
          name: 'Heritage Scholar',
          description: 'Decipher 25 monuments',
          icon: '🎓',
          unlocked: decipheredCount >= 25,
          progress: Math.min(decipheredCount, 25),
          maxProgress: 25,
          rarity: 'epic',
          unlockedAt: decipheredCount >= 25 ? new Date() : undefined,
        },
        {
          id: 'time-traveler',
          name: 'Time Traveler',
          description: 'Generate video history for 10 monuments',
          icon: '⏰',
          unlocked: false, // Would need to track video generations
          progress: 0,
          maxProgress: 10,
          rarity: 'legendary',
        },
        {
          id: 'community-legend',
          name: 'Community Legend',
          description: 'Get 100 likes on your discoveries',
          icon: '👑',
          unlocked: false, // Would need to track community likes
          progress: 0,
          maxProgress: 100,
          rarity: 'legendary',
        },
        {
          id: 'world-explorer',
          name: 'World Explorer',
          description: 'Visit monuments in 10 different countries',
          icon: '🌍',
          unlocked: false, // Would need to track countries
          progress: 0,
          maxProgress: 10,
          rarity: 'epic',
        },
      ]

      setBadges(allBadges)
    } catch (error) {
      console.error('Error loading badges:', error)
      setBadges([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D8]">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#D4D4D8]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <RetroGrid className="opacity-10" />
      </div>

      <Navbar />
      
      <main className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Award className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Heritage Passport</h1>
                <p className="text-gray-600 text-sm">Your digital stamps and achievements</p>
              </div>
            </div>
          </motion.div>

          <HeritagePassport badges={badges} />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default HeritagePassportPage

