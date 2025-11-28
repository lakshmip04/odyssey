import { useEffect, useState, useRef } from 'react'
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
  Download,
  Image as ImageIcon
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { RetroGrid } from '../components/ui/retro-grid'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  getAllCommunityDiscoveries,
  likeDiscovery,
  unlikeDiscovery,
  markDiscoveryAsLearned,
  unmarkDiscoveryAsLearned,
  createCommunityDiscovery,
  type CommunityDiscovery
} from '../lib/communityDiscoveriesApi'
import { uploadPhoto } from '../lib/storageApi'


const CommunityDiscoveries = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated, user } = useSupabaseAuth()
  const [discoveries, setDiscoveries] = useState<CommunityDiscovery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [publishType, setPublishType] = useState<'discovery' | 'post'>('discovery')
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [publishForm, setPublishForm] = useState({
    site_name: '',
    location: '',
    translated_text: '',
    original_text: '',
    description: '',
    image_url: '',
    video_url: '',
  })
  const imageInputRef = useRef<HTMLInputElement>(null)

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
    setIsLoading(true)
    try {
      const data = await getAllCommunityDiscoveries()
      setDiscoveries(data)
    } catch (error) {
      console.error('Error loading discoveries:', error)
      alert('Failed to load discoveries. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (discoveryId: string) => {
    const discovery = discoveries.find(d => d.id === discoveryId)
    if (!discovery) return

    try {
      if (discovery.is_liked) {
        await unlikeDiscovery(discoveryId)
        setDiscoveries(prev => prev.map(d => 
          d.id === discoveryId 
            ? { ...d, is_liked: false, likes: Math.max(0, d.likes - 1) }
            : d
        ))
      } else {
        await likeDiscovery(discoveryId)
        setDiscoveries(prev => prev.map(d => 
          d.id === discoveryId 
            ? { ...d, is_liked: true, likes: d.likes + 1 }
            : d
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      alert('Failed to update like. Please try again.')
    }
  }

  const handleLearn = async (discoveryId: string) => {
    const discovery = discoveries.find(d => d.id === discoveryId)
    if (!discovery) return

    try {
      if (discovery.is_learned) {
        await unmarkDiscoveryAsLearned(discoveryId)
        setDiscoveries(prev => prev.map(d => 
          d.id === discoveryId 
            ? { ...d, is_learned: false, learned_count: Math.max(0, d.learned_count - 1) }
            : d
        ))
      } else {
        await markDiscoveryAsLearned(discoveryId)
        setDiscoveries(prev => prev.map(d => 
          d.id === discoveryId 
            ? { ...d, is_learned: true, learned_count: d.learned_count + 1 }
            : d
        ))
      }
    } catch (error) {
      console.error('Error toggling learned:', error)
      alert('Failed to update learned status. Please try again.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB')
      return
    }

    setUploadedImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePublish = async () => {
    if (publishType === 'discovery' && (!publishForm.site_name || !publishForm.translated_text)) {
      alert('Please fill in required fields (Site Name and Translated Text)')
      return
    }

    if (publishType === 'post' && (!publishForm.site_name || (!publishForm.image_url && !uploadedImageFile))) {
      alert('Please fill in required fields (Site Name and Image)')
      return
    }

    setIsPublishing(true)
    
    try {
      let imageUrl = publishForm.image_url

      // Upload image if file was selected
      if (uploadedImageFile && user) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadPhoto(uploadedImageFile, user.id, 'community-discoveries')
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          alert('Failed to upload image. Please try again.')
          setIsUploadingImage(false)
          setIsPublishing(false)
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      const newDiscovery = await createCommunityDiscovery({
        type: publishType,
        site_name: publishForm.site_name,
        location: publishForm.location || undefined,
        original_text: publishType === 'discovery' ? publishForm.original_text || undefined : undefined,
        translated_text: publishType === 'discovery' ? publishForm.translated_text || undefined : undefined,
        description: publishForm.description || undefined,
        image_url: imageUrl || undefined,
        video_url: publishForm.video_url || undefined,
      })
      
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
      setUploadedImageFile(null)
      setUploadedImagePreview(null)
      setPublishType('discovery')
      await loadDiscoveries() // Reload to get the new discovery with proper counts
    } catch (error) {
      console.error('Error publishing discovery:', error)
      alert('Failed to publish discovery. Please try again.')
    } finally {
      setIsPublishing(false)
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
                      {/* Type Selection */}
                      <div>
                        <Label>Type *</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant={publishType === 'discovery' ? 'default' : 'outline'}
                            onClick={() => setPublishType('discovery')}
                            className={publishType === 'discovery' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' : ''}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Discovery
                          </Button>
                          <Button
                            type="button"
                            variant={publishType === 'post' ? 'default' : 'outline'}
                            onClick={() => setPublishType('post')}
                            className={publishType === 'post' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' : ''}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Post
                          </Button>
                        </div>
                      </div>
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
                      {publishType === 'discovery' && (
                        <>
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
                        </>
                      )}
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
                      <div>
                        <Label htmlFor="image">Image {publishType === 'post' ? '*' : '(optional)'}</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => imageInputRef.current?.click()}
                              className="flex-1"
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              {uploadedImageFile ? 'Change Image' : 'Upload Image'}
                            </Button>
                            {uploadedImageFile && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setUploadedImageFile(null)
                                  setUploadedImagePreview(null)
                                  if (imageInputRef.current) {
                                    imageInputRef.current.value = ''
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {uploadedImagePreview && (
                            <div className="mt-2">
                              <img
                                src={uploadedImagePreview}
                                alt="Preview"
                                className="w-full max-h-64 object-contain rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          )}
                          <div className="text-sm text-gray-500">OR</div>
                          <Input
                            id="image_url"
                            value={publishForm.image_url}
                            onChange={(e) => setPublishForm({ ...publishForm, image_url: e.target.value })}
                            placeholder="Enter image URL (https://...)"
                            disabled={!!uploadedImageFile}
                          />
                        </div>
                      </div>
                      {publishType === 'discovery' && (
                        <div>
                          <Label htmlFor="video_url">Video URL (optional)</Label>
                          <Input
                            id="video_url"
                            value={publishForm.video_url}
                            onChange={(e) => setPublishForm({ ...publishForm, video_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 border-t">
                      <Button variant="outline" onClick={() => setIsPublishOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePublish}
                        disabled={isPublishing || isUploadingImage || (publishType === 'discovery' && (!publishForm.site_name || !publishForm.translated_text)) || (publishType === 'post' && (!publishForm.site_name || (!publishForm.image_url && !uploadedImageFile)))}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        {isPublishing || isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isUploadingImage ? 'Uploading Image...' : 'Publishing...'}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : discoveries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No discoveries yet. Be the first to share!</p>
            </div>
          ) : (
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
                          {new Date(discovery.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Site Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{discovery.site_name}</h3>
                    {discovery.type === 'post' && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Post</span>
                    )}
                    {discovery.type === 'discovery' && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Discovery</span>
                    )}
                  </div>
                  {discovery.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{discovery.location}</span>
                    </div>
                  )}

                  {/* For Discovery Type: Show Original and Translated Text */}
                  {discovery.type === 'discovery' && (
                    <>
                      {discovery.original_text && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Original Text</p>
                          <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">{discovery.original_text}</p>
                        </div>
                      )}
                      {discovery.translated_text && (
                        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-600 mb-1 font-semibold">Translation</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{discovery.translated_text}</p>
                        </div>
                      )}
                    </>
                  )}

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
                    {discovery.type === 'discovery' && (
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
                    )}
                    <button className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </Card>
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default CommunityDiscoveries
