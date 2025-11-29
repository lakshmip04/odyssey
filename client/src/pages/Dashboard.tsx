import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { getUserItineraries, type Itinerary } from '../lib/itineraryApi'
import { getVisitedLocations, getUserJournalEntries, type TravelJournalEntry } from '../lib/travelJournalApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FogOfWarMap from '../components/FogOfWarMap'
import { 
  BookOpen, 
  Users, 
  ArrowRight,
  Plus,
  Wand2,
  Lock,
  MapPin
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, loading, isAuthenticated } = useSupabaseAuth()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [visitedLocations, setVisitedLocations] = useState<Array<{
    lat: number
    lng: number
    name: string
    visitedAt: string
  }>>([])
  const [journalEntries, setJournalEntries] = useState<TravelJournalEntry[]>([])
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalSites: 0,
    countriesVisited: 0,
    storiesCreated: 0,
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const loadItineraries = async () => {
    try {
      const data = await getUserItineraries()
      setItineraries(data || [])
      
      // Calculate stats
      const totalSites = (data || []).reduce((sum, it) => sum + (it.items?.length || 0), 0)
      const countries = new Set((data || []).map(it => it.location).filter(Boolean))
      
      setStats({
        totalTrips: (data || []).length,
        totalSites,
        countriesVisited: countries.size,
        storiesCreated: 0,
      })
    } catch (error) {
      console.error('Error loading itineraries:', error)
      setItineraries([])
      setStats({
        totalTrips: 0,
        totalSites: 0,
        countriesVisited: 0,
        storiesCreated: 0,
      })
    }
  }

  const loadVisitedLocations = async () => {
    try {
      const locations = await getVisitedLocations()
      setVisitedLocations(locations)
    } catch (error) {
      console.error('Error loading visited locations:', error)
      setVisitedLocations([])
    }
  }

  const loadJournalEntries = async () => {
    try {
      const entries = await getUserJournalEntries()
      setJournalEntries(entries)
      setStats(prev => ({
        ...prev,
        storiesCreated: entries.length,
      }))
      
      // Calculate weekly activity
      calculateWeeklyActivity(entries)
    } catch (error) {
      console.error('Error loading journal entries:', error)
      setJournalEntries([])
      setWeeklyActivity([0, 0, 0, 0, 0, 0, 0])
    }
  }

  const calculateWeeklyActivity = (entries: TravelJournalEntry[]) => {
    // Get last 7 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekData = Array(7).fill(0)
    
    // Count entries for each of the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (6 - i)) // Start from 6 days ago, go to today
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      // Count entries created on this day
      const count = entries.filter(entry => {
        const entryDate = new Date(entry.created_at)
        return entryDate >= dayStart && entryDate <= dayEnd
      }).length
      
      weekData[i] = count
    }
    
    // Normalize to percentage (0-100) for visualization
    const maxCount = Math.max(...weekData, 1) // Avoid division by zero
    const normalizedData = weekData.map(count => Math.round((count / maxCount) * 100))
    
    setWeeklyActivity(normalizedData)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadItineraries()
      loadVisitedLocations()
      loadJournalEntries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Please log in to view your dashboard</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#D4D4D8]">
      <Navbar />
      
      <main className="flex-grow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Welcome back{user && 'user_metadata' in user && user.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!
                </h1>
                <p className="text-gray-600 text-sm">
                  Your travel journey dashboard
                </p>
              </div>
              <Button
                onClick={() => navigate('/planner')}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            </div>
          </motion.div>

          {/* Bento Grid - 3x3 Layout */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:grid-rows-3">
            {/* Feature 1: Fog of War Map (Yellow) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <BentoCard 
                className="bg-[#FDE047] flex flex-col p-4 cursor-pointer hover:bg-[#FACC15] transition-colors"
                onClick={() => navigate('/fog-of-war')}
              >
                <div className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Fog of War
                </div>
                <div className="flex-1 min-h-[120px] rounded-lg overflow-hidden bg-gray-800">
                  <FogOfWarMap 
                    visitedLocations={visitedLocations}
                    className="h-full"
                  />
                </div>
                <div className="mt-2 text-xs text-yellow-800 font-medium">
                  {visitedLocations.length} regions discovered
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 2: Community Discoveries (Purple) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="sm:col-span-2"
            >
              <BentoCard 
                className="bg-[#8B5CF6] flex flex-col p-4 cursor-pointer hover:bg-[#7C3AED] transition-colors"
                onClick={() => navigate('/community')}
              >
                <strong className="text-2xl font-semibold text-white mb-2">
                  {stats.totalSites > 0 ? `${stats.totalSites}+` : '0'} Heritage Sites
                </strong>
                <p className="text-white/90 text-sm mb-auto">
                  Discovered in your journeys
                </p>
                <div className="mt-auto flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Community Discoveries</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 3: Smart Planner (Orange) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <BentoCard 
                className="bg-[#FDBA74] flex flex-col p-4 cursor-pointer hover:bg-[#FB923C] transition-colors"
                onClick={() => navigate('/planner')}
              >
                <Wand2 className="w-8 h-8 md:w-10 md:h-10 text-orange-900 mb-2" />
                <strong className="text-sm font-semibold text-orange-900 mb-2">Smart Planner</strong>
                <div className="mt-auto">
                  <div className="text-sm font-medium text-orange-900 mb-1">AI-powered routes</div>
                  <div className="font-semibold text-orange-900">
                    Optimize your journey
                  </div>
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 4: Travel Journal (Light Green) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="sm:col-span-2 sm:flex-row"
            >
              <BentoCard 
                className="bg-[#BEF265] flex items-center gap-4 p-4 sm:flex-row-reverse cursor-pointer hover:bg-[#A3E635] transition-colors"
                onClick={() => navigate('/journal')}
              >
                <div className="flex-1">
                  <div className="text-xl font-black text-green-800 mb-2">
                    Travel Journal
                  </div>
                  <div className="text-sm text-green-700 mb-2">
                    {journalEntries.length > 0 
                      ? `${journalEntries.length} entries with notes & photos`
                      : 'Start documenting your adventures'
                    }
                  </div>
                  {journalEntries.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-800">
                      <MapPin className="w-3 h-3" />
                      <span>Auto-logged visits • AI translations saved</span>
                    </div>
                  )}
                </div>
                <div className="relative max-h-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/50 p-3">
                  <BookOpen className="w-12 h-12 text-green-700" />
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 5: Heritage Passport (Gray with text) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="sm:col-span-2"
            >
              <BentoCard 
                className="bg-[#D4D4D8] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#A1A1AA] transition-colors"
                onClick={() => navigate('/passport')}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="text-6xl md:text-8xl font-black text-gray-600/30 absolute">
                    ODYSSEY
            </div>
                  <div className="text-2xl md:text-4xl font-black text-gray-800 relative z-10">
                    Heritage Passport
            </div>
          </div>
              </BentoCard>
            </motion.div>

            {/* Feature 6: Weekly Review Chart (Mint Green) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <BentoCard 
                className="bg-[#BCF8D0] p-4 cursor-pointer hover:bg-[#A7F3D0] transition-colors"
                onClick={() => navigate('/journal')}
              >
                <div className="h-24 flex items-end justify-between gap-1 mb-2">
                  {weeklyActivity.length > 0 ? (
                    weeklyActivity.map((height, index) => {
                      const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                      const today = new Date()
                      const dayIndex = (today.getDay() + index - 6 + 7) % 7
                      const isToday = index === 6
                      
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 gap-1">
                          <div
                            className={`w-full rounded-t-lg transition-all ${
                              isToday ? 'bg-green-700' : 'bg-green-500'
                            }`}
                            style={{ 
                              height: `${Math.max(height, 5)}%`,
                              minHeight: '4px'
                            }}
                            title={`${dayLabels[dayIndex]}: ${journalEntries.filter(entry => {
                              const entryDate = new Date(entry.created_at)
                              const checkDate = new Date(today)
                              checkDate.setDate(checkDate.getDate() - (6 - index))
                              return entryDate.toDateString() === checkDate.toDateString()
                            }).length} entries`}
                          />
                          <span className={`text-xs font-medium ${isToday ? 'text-green-700 font-bold' : 'text-green-600'}`}>
                            {dayLabels[dayIndex]}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    // Show empty state
                    Array(7).fill(0).map((_, index) => {
                      const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 gap-1">
                          <div
                            className="w-full rounded-t-lg bg-green-200"
                            style={{ height: '5%', minHeight: '4px' }}
                          />
                          <span className="text-xs text-green-600">{dayLabels[index]}</span>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="text-center font-bold text-green-800 text-sm">
                  Weekly Activity
                </div>
                <div className="text-center text-xs text-green-700 mt-1">
                  {journalEntries.length > 0 
                    ? `${journalEntries.length} total entries`
                    : 'No activity yet'
                  }
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 7: Story Video Generation (Pink) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <BentoCard 
                className="bg-[#FEA4AF] flex flex-col gap-2 p-4 cursor-pointer hover:bg-[#FB7185] transition-colors"
                onClick={() => navigate('/story-video')}
              >
                <div className="w-full -rotate-1 rounded-full border-[#FB7185] bg-[#FB7185] py-2 text-center font-semibold text-white text-sm md:-rotate-3 flex items-center justify-center gap-2">
                  <Wand2 className="w-3 h-3" />
                  AI Story Video
                </div>
                <div className="w-full rotate-1 rounded-full border-[#FB7185] bg-[#FB7185] py-2 text-center font-semibold text-white text-sm md:rotate-3">
                  Generate Stories
                </div>
                <div className="w-full rounded-full border-[#FB7185] bg-[#FB7185] py-2 text-center font-semibold text-white text-sm">
                  Share Your Journey
                </div>
              </BentoCard>
            </motion.div>

            {/* Feature 8: Recent Trips (Light Blue) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="sm:col-span-2"
            >
              <BentoCard className="bg-[#C0DBFE] flex flex-col p-4">
                <div className="mb-4">
                  <div className="text-lg font-black text-blue-800 mb-2">Recent Trips</div>
                  <p className="text-sm text-blue-700">
                    {itineraries.length > 0 
                      ? `You have ${itineraries.length} saved ${itineraries.length === 1 ? 'trip' : 'trips'}`
                      : 'Start planning your first adventure'
                    }
                  </p>
                </div>
                {itineraries.length > 0 && (
                  <div className="mt-auto space-y-2">
                    {itineraries.slice(0, 2).map((it) => (
                      <Link
                        key={it.id}
                        to="/planner"
                        className="block p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-blue-900 text-sm truncate">
                              {it.name}
                            </h4>
                            <p className="text-xs text-blue-700 truncate">
                              {it.location} • {it.items?.length || 0} sites
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-blue-700 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
            </div>
          )}
              </BentoCard>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Bento Card Component
function BentoCard({ 
  children, 
  className,
  onClick 
}: { 
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  )
}

export default Dashboard
