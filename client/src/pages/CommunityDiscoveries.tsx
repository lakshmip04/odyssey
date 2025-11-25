import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Users, MapPin, Star, Heart, Share2 } from 'lucide-react'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'

const CommunityDiscoveries = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

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

  // Mock community discoveries - in production, fetch from database
  const discoveries = [
    {
      id: '1',
      user: 'Traveler123',
      site: 'Taj Mahal',
      location: 'Agra, India',
      rating: 4.9,
      likes: 234,
      description: 'Absolutely breathtaking! The marble work is incredible.',
      image: null,
    },
    {
      id: '2',
      user: 'Wanderlust',
      site: 'Machu Picchu',
      location: 'Peru',
      rating: 4.8,
      likes: 189,
      description: 'The sunrise view from here is magical!',
      image: null,
    },
    {
      id: '3',
      user: 'Explorer',
      site: 'Great Wall of China',
      location: 'China',
      rating: 4.7,
      likes: 156,
      description: 'A must-visit heritage site. The history is fascinating.',
      image: null,
    },
  ]

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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#8B5CF6]/20">
                <Users className="w-6 h-6 text-purple-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Community Discoveries</h1>
                <p className="text-gray-600 text-sm">See what others are exploring</p>
              </div>
            </div>
          </motion.div>

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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold text-sm">
                          {discovery.user[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{discovery.user}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{discovery.site}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{discovery.location}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{discovery.description}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-800">{discovery.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{discovery.likes}</span>
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

