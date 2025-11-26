import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { getUserJournalEntries, type TravelJournalEntry, deleteJournalEntry } from '../lib/travelJournalApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EditJournalEntryDialog from '../components/EditJournalEntryDialog'
import { BookOpen, MapPin, Calendar, Camera, Languages, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'

const TravelJournal = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [journalEntries, setJournalEntries] = useState<TravelJournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<TravelJournalEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const handleEditEntry = (entry: TravelJournalEntry) => {
    setEditingEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return
    }

    try {
      await deleteJournalEntry(entryId)
      await loadJournalEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry. Please try again.')
    }
  }

  const handleSaveEntry = async () => {
    await loadJournalEntries()
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
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{entry.site_name}</h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
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
                          {entry.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="aspect-square rounded-lg bg-gray-200 overflow-hidden"
                            >
                              <img
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>'
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {entry.ai_translations && (
                        <div className="p-4 bg-[#BEF265]/10 rounded-lg border border-[#BEF265]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Languages className="w-4 h-4 text-green-800" />
                            <span className="text-sm font-semibold text-green-800">AI Translations</span>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(entry.ai_translations).map(([key, value]) => {
                              if (key === 'generated_at') return null
                              if (typeof value === 'object' && value !== null && 'translations' in value) {
                                return (
                                  <div key={key} className="space-y-2">
                                    <p className="text-sm font-semibold text-green-800 capitalize">
                                      {key.replace('_', ' ')}
                                    </p>
                                    <div className="space-y-1">
                                      <p className="text-xs text-gray-600">
                                        <span className="font-medium">Original:</span> {value.original}
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pl-2">
                                        {Object.entries(value.translations).map(([lang, translation]) => (
                                          <div key={lang} className="text-xs">
                                            <span className="font-medium capitalize text-green-700">{lang}:</span>{' '}
                                            <span className="text-gray-700">{translation as string}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              if (typeof value === 'object' && value !== null) {
                                return (
                                  <div key={key} className="space-y-2">
                                    <p className="text-sm font-semibold text-green-800 capitalize">
                                      {key.replace('_', ' ')}
                                    </p>
                                    {Object.entries(value).map(([phrase, translations]) => (
                                      <div key={phrase} className="text-xs space-y-1 pl-2">
                                        <p className="font-medium text-gray-800">{phrase}</p>
                                        <div className="pl-2 space-y-0.5">
                                          {Object.entries(translations as Record<string, string>).map(([lang, translation]) => (
                                            <p key={lang}>
                                              <span className="font-medium capitalize text-green-700">{lang}:</span>{' '}
                                              <span className="text-gray-700">{translation}</span>
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              }
                              return null
                            })}
                            {entry.ai_translations.generated_at && (
                              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-[#BEF265]/30">
                                Generated: {new Date(entry.ai_translations.generated_at as string).toLocaleString()}
                              </p>
                            )}
                          </div>
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

      <EditJournalEntryDialog
        entry={editingEntry}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingEntry(null)
        }}
        onSave={handleSaveEntry}
      />
    </div>
  )
}

export default TravelJournal

