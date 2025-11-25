import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { getUserJournalEntries, type TravelJournalEntry } from '../lib/travelJournalApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { BookOpen, MapPin, Calendar, Camera, Languages, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'

const TravelJournal = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [journalEntries, setJournalEntries] = useState<TravelJournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      loadJournalEntries()
    }
  }, [isAuthenticated])

  const loadJournalEntries = async () => {
    setIsLoading(true)
    try {
      const entries = await getUserJournalEntries()
      setJournalEntries(entries)
    } catch (error) {
      console.error('Error loading journal entries:', error)
      setJournalEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#BEF265]/20">
                  <BookOpen className="w-6 h-6 text-green-800" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Travel Journal</h1>
                  <p className="text-gray-600 text-sm">Document your adventures</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/planner')}
                className="bg-[#BEF265] hover:bg-[#A3E635] text-green-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </div>
          </motion.div>

          {/* Journal Entries */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {journalEntries.length > 0 ? (
                journalEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{entry.site_name}</h3>
                          {entry.location_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{entry.location_name}</span>
                              {entry.country && <span>• {entry.country}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(entry.visited_at).toLocaleDateString()}</span>
                            </div>
                            {entry.photos && entry.photos.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>{entry.photos.length} photos</span>
                              </div>
                            )}
                            {entry.ai_translations && (
                              <div className="flex items-center gap-1">
                                <Languages className="w-3 h-3" />
                                <span>AI Translations</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                      )}

                      {entry.photos && entry.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {entry.photos.slice(0, 3).map((_photo, idx) => (
                            <div
                              key={idx}
                              className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden"
                            >
                              <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      )}

                      {entry.ai_translations && (
                        <div className="p-4 bg-[#BEF265]/10 rounded-lg border border-[#BEF265]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Languages className="w-4 h-4 text-green-800" />
                            <span className="text-sm font-semibold text-green-800">AI Translations</span>
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(entry.ai_translations, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No journal entries yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Start exploring to automatically log your visits
                  </p>
                  <Button
                    onClick={() => navigate('/planner')}
                    className="bg-[#BEF265] hover:bg-[#A3E635] text-green-900"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Entry
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TravelJournal

