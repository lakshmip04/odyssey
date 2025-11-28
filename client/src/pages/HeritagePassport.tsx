import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeritagePassport from '../components/HeritagePassport'
import { getUserBadgesWithDetails, checkAndUpdateAllBadges } from '../lib/badgesApi'
import type { Badge } from '../components/HeritagePassport'
import { Award, Loader2 } from 'lucide-react'
import { RetroGrid } from '../components/ui/retro-grid'

const HeritagePassportPage = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    setIsLoading(true)
    try {
      // First, check and update all badges (automation)
      await checkAndUpdateAllBadges()
      
      // Then fetch user badges with details
      const badgesWithDetails = await getUserBadgesWithDetails()
      
      // Convert to Badge format expected by component
      const allBadges: Badge[] = badgesWithDetails.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        unlocked: b.unlocked,
        progress: b.progress,
        maxProgress: b.maxProgress,
        rarity: b.rarity,
        unlockedAt: b.unlockedAt,
      }))

      setBadges(allBadges)
    } catch (error) {
      console.error('Error loading badges:', error)
      setBadges([])
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <div className="text-xl">Loading badges...</div>
        </div>
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

