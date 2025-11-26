import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { 
  Users, 
  MapPin, 
  Heart, 
  Share2, 
  Plus, 
  X, 
  Video, 
  FileText, 
  BookOpen,
  Loader2,
  Play,
  Download
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { RetroGrid } from '../components/ui/retro-grid'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

interface CommunityDiscovery {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  site_name: string
  location: string
  original_text?: string
  translated_text: string
  image_url?: string
  video_url?: string
  likes: number
  is_liked: boolean
  learned_count: number
  is_learned: boolean
  description?: string
  created_at: Date
}

const CommunityDiscoveries = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated, user } = useSupabaseAuth()
  const [discoveries, setDiscoveries] = useState<CommunityDiscovery[]>([])
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishForm, setPublishForm] = useState({
    site_name: '',
    location: '',
    translated_text: '',
    original_text: '',
    description: '',
    image_url: '',
    video_url: '',
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      loadDiscoveries()
    }
  }, [isAuthenticated])

  const loadDiscoveries = async () => {
    // Mock data - in production, fetch from Supabase
    const mockDiscoveries: CommunityDiscovery[] = [
      {
        id: '1',
        user_id: 'user1',
        user_name: 'Traveler123',
        site_name: 'Ashokan Edict at Sarnath',
        location: 'Sarnath, India',
        original_text: 'धम्म लिपि...',
        translated_text: 'The Dhamma script... This edict speaks of the principles of righteousness and moral conduct.',
        description: 'Discovered this ancient Ashokan edict during my visit. The translation reveals fascinating insights into ancient governance.',
        likes: 234,
        is_liked: false,
        learned_count: 89,
        is_learned: false,
        created_at: new Date('2024-01-15'),
      },
      {
        id: '2',
        user_id: 'user2',
        user_name: 'HeritageExplorer',
        site_name: 'Temple Inscription at Hampi',
        location: 'Hampi, India',
        original_text: 'श्री विरुपाक्ष...',
        translated_text: 'Shri Virupaksha... This temple inscription dates back to the 14th century and describes the temple\'s construction.',
        description: 'Deciphered this beautiful temple inscription. The architectural details mentioned are still visible today!',
        likes: 189,
        is_liked: true,
        learned_count: 67,
        is_learned: true,
        video_url: 'generated',
        created_at: new Date('2024-01-20'),
      },
      {
        id: '3',
        user_id: 'user3',
        user_name: 'ScriptScholar',
        site_name: 'Brahmi Script at Sanchi',
        location: 'Sanchi, India',
        original_text: 'बुद्धं शरणं...',
        translated_text: 'Buddham Sharanam... This ancient Buddhist inscription is one of the earliest examples of Brahmi script.',
        description: 'An incredible find! This inscription provides crucial evidence about the spread of Buddhism in ancient India.',
        likes: 156,
        is_liked: false,
        learned_count: 45,
        is_learned: false,
        created_at: new Date('2024-01-25'),
      },
    ]
    setDiscoveries(mockDiscoveries)
  }

  const handleLike = async (discoveryId: string) => {
    setDiscoveries(prev => prev.map(d => 
      d.id === discoveryId 
        ? { 
            ...d, 
            is_liked: !d.is_liked,
            likes: d.is_liked ? d.likes - 1 : d.likes + 1
          }
        : d
    ))
    // In production, call API to like/unlike
  }

  const handleLearn = async (discoveryId: string) => {
    setDiscoveries(prev => prev.map(d => 
      d.id === discoveryId 
        ? { 
            ...d, 
            is_learned: !d.is_learned,
            learned_count: d.is_learned ? d.learned_count - 1 : d.learned_count + 1
          }
        : d
    ))
    // In production, call API to mark as learned
  }

  const handlePublish = async () => {
    if (!publishForm.site_name || !publishForm.translated_text) {
      alert('Please fill in required fields')
      return
    }

    setIsPublishing(true)
    
    // Simulate API call
    setTimeout(() => {
      const newDiscovery: CommunityDiscovery = {
        id: Date.now().toString(),
        user_id: user?.id || 'current_user',
        user_name: user?.email?.split('@')[0] || 'You',
        site_name: publishForm.site_name,
        location: publishForm.location,
        original_text: publishForm.original_text,
        translated_text: publishForm.translated_text,
        description: publishForm.description,
        image_url: publishForm.image_url,
        video_url: publishForm.video_url,
        likes: 0,
        is_liked: false,
        learned_count: 0,
        is_learned: false,
        created_at: new Date(),
      }
      
      setDiscoveries(prev => [newDiscovery, ...prev])
      setIsPublishOpen(false)
      setPublishForm({
        site_name: '',
        location: '',
        translated_text: '',
        original_text: '',
        description: '',
        image_url: '',
        video_url: '',
      })
      setIsPublishing(false)
    }, 1500)
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8B5CF6]/20">
                  <Users className="w-6 h-6 text-purple-800" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Community Discoveries</h1>
                  <p className="text-gray-600 text-sm">Share and learn from deciphered monuments</p>
                </div>
              </div>
              <Button
                onClick={() => setIsPublishOpen(true)}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Publish Discovery
              </Button>
            </div>
          </motion.div>

          {/* Publish Dialog */}
          <AnimatePresence>
            {isPublishOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPublishOpen(false)}
                  className="fixed inset-0 bg-black/50 z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-2xl font-bold">Publish Your Discovery</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPublishOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <div>
                        <Label htmlFor="site_name">Monument/Site Name *</Label>
                        <Input
                          id="site_name"
                          value={publishForm.site_name}
                          onChange={(e) => setPublishForm({ ...publishForm, site_name: e.target.value })}
                          placeholder="e.g., Ashokan Edict at Sarnath"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={publishForm.location}
                          onChange={(e) => setPublishForm({ ...publishForm, location: e.target.value })}
                          placeholder="e.g., Sarnath, India"
                        />
                      </div>
                      <div>
                        <Label htmlFor="original_text">Original Text</Label>
                        <textarea
                          id="original_text"
                          value={publishForm.original_text}
                          onChange={(e) => setPublishForm({ ...publishForm, original_text: e.target.value })}
                          placeholder="The original inscription text..."
                          className="w-full min-h-[100px] p-3 border rounded-lg resize-y"
                        />
                      </div>
                      <div>
                        <Label htmlFor="translated_text">Translated Text *</Label>
                        <textarea
                          id="translated_text"
                          value={publishForm.translated_text}
                          onChange={(e) => setPublishForm({ ...publishForm, translated_text: e.target.value })}
                          placeholder="Your translation..."
                          className="w-full min-h-[120px] p-3 border rounded-lg resize-y"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          value={publishForm.description}
                          onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                          placeholder="Share your insights and experience..."
                          className="w-full min-h-[100px] p-3 border rounded-lg resize-y"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="image_url">Image URL (optional)</Label>
                          <Input
                            id="image_url"
                            value={publishForm.image_url}
                            onChange={(e) => setPublishForm({ ...publishForm, image_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="video_url">Video URL (optional)</Label>
                          <Input
                            id="video_url"
                            value={publishForm.video_url}
                            onChange={(e) => setPublishForm({ ...publishForm, video_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 border-t">
                      <Button variant="outline" onClick={() => setIsPublishOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          'Publish'
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Discoveries Feed */}
          <div className="space-y-4">
            {discoveries.map((discovery, index) => (
              <motion.div
                key={discovery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 hover:shadow-lg transition-shadow">
                  {/* User Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                        {discovery.user_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{discovery.user_name}</p>
                        <p className="text-xs text-gray-500">
                          {discovery.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Site Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{discovery.site_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{discovery.location}</span>
                  </div>

                  {/* Original Text */}
                  {discovery.original_text && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Original Text</p>
                      <p className="text-sm text-gray-700 font-mono">{discovery.original_text}</p>
                    </div>
                  )}

                  {/* Translated Text */}
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1 font-semibold">Translation</p>
                    <p className="text-sm text-gray-700">{discovery.translated_text}</p>
                  </div>

                  {/* Description */}
                  {discovery.description && (
                    <p className="text-gray-700 mb-4">{discovery.description}</p>
                  )}

                  {/* Media */}
                  {discovery.image_url && (
                    <div className="mb-4">
                      <img
                        src={discovery.image_url}
                        alt={discovery.site_name}
                        className="w-full rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}

                  {discovery.video_url && (
                    <div className="mb-4 aspect-video bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Generated Video History</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Play className="w-4 h-4 mr-2" />
                          Play Video
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(discovery.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        discovery.is_liked
                          ? 'text-red-500'
                          : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${discovery.is_liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{discovery.likes}</span>
                    </button>
                    <button
                      onClick={() => handleLearn(discovery.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        discovery.is_learned
                          ? 'text-blue-500'
                          : 'text-gray-600 hover:text-blue-500'
                      }`}
                    >
                      <BookOpen className={`w-5 h-5 ${discovery.is_learned ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">
                        {discovery.learned_count} learned
                      </span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default CommunityDiscoveries
