import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Video, Wand2, Play, Download, Share2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'

const StoryVideo = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const handleGenerateStory = async () => {
    setIsGenerating(true)
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false)
      alert('Story video generation feature coming soon!')
    }, 2000)
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FEA4AF]/20">
                <Video className="w-6 h-6 text-rose-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Story Video Generation</h1>
                <p className="text-gray-600 text-sm">AI-powered travel stories</p>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <Card className="p-8 bg-background/80 backdrop-blur-xl border-2">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#FEA4AF]/20 flex items-center justify-center">
                <Wand2 className="w-12 h-12 text-rose-800" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Travel Story</h2>
              <p className="text-gray-600">
                Transform your travel journal entries into beautiful video stories
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatically compile your journal entries</li>
                  <li>• Add photos and videos from your trips</li>
                  <li>• AI-generated narration and music</li>
                  <li>• Customizable themes and styles</li>
                  <li>• Export in HD quality</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="bg-[#FEA4AF] hover:bg-[#FB7185] text-white"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Story Video
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Placeholder for generated video */}
            <div className="mt-8 aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Your generated story video will appear here</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default StoryVideo

