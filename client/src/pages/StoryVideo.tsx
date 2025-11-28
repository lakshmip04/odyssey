import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { 
  FileImage, 
  Languages, 
  Volume2, 
  Video, 
  Upload, 
  Loader2, 
  X, 
  Play, 
  Pause,
  Download,
  Copy,
  Check,
  Camera,
  CameraOff,
  MessageCircle,
  Send,
  History,
  Sparkles,
  Share2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'
import { Select } from '../components/ui/select'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { createCommunityDiscovery } from '../lib/communityDiscoveriesApi'
import { uploadPhoto } from '../lib/storageApi'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
]

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AnalysisResult {
  originalText: string
  translatedText: string
  language: string
  videoHistory?: string
  context?: string
}

const StoryVideo = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated, user } = useSupabaseAuth()
  
  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Analysis states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  
  // TTS and Video states
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoHistory, setVideoHistory] = useState<string | null>(null)
  
  // File upload states (for document mode)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [originalText, setOriginalText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  
  // Publish states
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishForm, setPublishForm] = useState({
    site_name: '',
    location: '',
    description: '',
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setCameraStream(stream)
      setIsCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      setIsCameraActive(false)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/png')
        setCapturedImage(imageData)
        processImageWithTrOCR(imageData)
      }
    }
  }

  // TrOCR + Phi-3 Pipeline
  const processImageWithTrOCR = async (imageData: string) => {
    setIsProcessing(true)
    setAnalysisResult(null)
    setChatMessages([])
    
    try {
      // Simulate TrOCR processing (in production, call your TrOCR API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock TrOCR result - in production, this would be from your TrOCR API
      const mockTrOCRText = `श्री राम मंदिर
      
यह मंदिर भगवान राम को समर्पित है। इसका निर्माण प्राचीन काल में हुआ था और यह हिंदू धर्म के लिए एक महत्वपूर्ण तीर्थ स्थल है।

इस मंदिर का वास्तुकला द्रविड़ शैली में है और यह सैकड़ों वर्षों से यहां खड़ा है।`
      
      // Simulate translation
      const mockTranslation = `Shri Ram Temple
      
This temple is dedicated to Lord Rama. It was built in ancient times and is an important pilgrimage site for Hinduism.

The architecture of this temple is in Dravidian style and it has been standing here for hundreds of years.`
      
      // Simulate Phi-3 context generation
      const mockContext = `This is a Hindu temple dedicated to Lord Rama, one of the most revered deities in Hinduism. The temple features Dravidian architecture, characterized by its pyramid-shaped towers (gopurams), intricate carvings, and stone pillars. The temple has been a significant pilgrimage site for centuries, attracting devotees from across the region.`
      
      const result: AnalysisResult = {
        originalText: mockTrOCRText,
        translatedText: mockTranslation,
        language: 'hi',
        context: mockContext,
        videoHistory: 'generated'
      }
      
      setAnalysisResult(result)
      setOriginalText(mockTrOCRText)
      setTranslatedText(mockTranslation)
      
      // Add welcome message from AI
      setChatMessages([{
        role: 'ai',
        content: `I've analyzed this inscription/monument. The text reads: "${mockTranslation.substring(0, 100)}..." 

This appears to be a temple dedicated to Lord Rama with Dravidian architecture. How can I help you learn more about it?`,
        timestamp: new Date()
      }])
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Chat with AI (Phi-3)
  const handleChatSend = async () => {
    if (!chatInput.trim() || !analysisResult) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatting(true)

    // Simulate Phi-3 AI response based on context
    setTimeout(() => {
      const aiResponse = generateAIResponse(chatInput, analysisResult)
      const aiMessage: ChatMessage = {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
      setIsChatting(false)
    }, 1500)
  }

  const generateAIResponse = (question: string, context: AnalysisResult): string => {
    const lowerQuestion = question.toLowerCase()
    
    // Context-aware responses based on the analyzed monument
    if (lowerQuestion.includes('why') || lowerQuestion.includes('purpose') || lowerQuestion.includes('reason')) {
      return `Based on the inscription I analyzed, this monument was built as a place of worship and spiritual significance. The Dravidian architecture style suggests it was constructed during a period when this architectural style was prominent in South India. Such temples served as centers of religious, cultural, and social activities in ancient times.`
    }
    
    if (lowerQuestion.includes('when') || lowerQuestion.includes('date') || lowerQuestion.includes('age')) {
      return `While the exact date isn't specified in the inscription, the architectural style (Dravidian) and the condition of the stone suggest this temple is several centuries old. Dravidian architecture flourished between the 7th and 18th centuries CE. To determine the exact age, archaeological dating methods would be needed.`
    }
    
    if (lowerQuestion.includes('who') || lowerQuestion.includes('built') || lowerQuestion.includes('constructed')) {
      return `The inscription mentions this is a temple dedicated to Lord Rama. Typically, such temples were commissioned by rulers, wealthy patrons, or religious communities. The specific builder's name would require a more detailed analysis of the full inscription, which may contain dedications or donor information.`
    }
    
    if (lowerQuestion.includes('architecture') || lowerQuestion.includes('design') || lowerQuestion.includes('style')) {
      return `This temple features Dravidian architecture, characterized by pyramid-shaped towers (gopurams), intricate stone carvings, pillared halls (mandapas), and a central sanctum. The style emphasizes verticality and elaborate ornamentation, typical of South Indian temple architecture.`
    }
    
    if (lowerQuestion.includes('significance') || lowerQuestion.includes('important') || lowerQuestion.includes('meaning')) {
      return `This temple holds religious significance as a place dedicated to Lord Rama, a central figure in Hinduism. It serves as a pilgrimage site and represents centuries of cultural and religious heritage. The preservation of such monuments helps maintain cultural identity and provides insights into historical architectural techniques.`
    }
    
    // Default contextual response
    return `Based on my analysis of this monument, ${context.context || 'this appears to be a significant historical structure.'} The inscription I read provides details about its dedication and purpose. Is there a specific aspect you'd like to know more about? I can discuss its architecture, historical context, religious significance, or any other questions you have.`
  }

  // Generate video history
  const handleGenerateVideoHistory = async () => {
    if (!analysisResult) return

    setIsProcessing(true)
    
    // Simulate video generation
    setTimeout(() => {
      setVideoHistory('generated')
      setIsProcessing(false)
      alert('Video history generated! (In production, this would create an AI-generated historical video)')
    }, 3000)
  }

  // TTS functions
  const handleGenerateTTS = async () => {
    const text = analysisResult?.translatedText || translatedText
    if (!text) {
      alert('Please analyze an image first')
      return
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedLanguage
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      setAudioUrl('synthesized')
      speechSynthesis.speak(utterance)
      setIsPlaying(true)
      
      utterance.onend = () => {
        setIsPlaying(false)
      }
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      const text = analysisResult?.translatedText || translatedText
      if (text) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = selectedLanguage
        speechSynthesis.speak(utterance)
        setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
      }
    }
  }

  // File upload (for document mode)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageData = reader.result as string
      setUploadedImage(imageData)
      processImageWithTrOCR(imageData)
    }
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    stopCamera()
    setCapturedImage(null)
    setUploadedImage(null)
    setAnalysisResult(null)
    setOriginalText('')
    setTranslatedText('')
    setChatMessages([])
    setAudioUrl(null)
    setVideoHistory(null)
    setIsPlaying(false)
    speechSynthesis.cancel()
    setIsPublishOpen(false)
    setPublishForm({
      site_name: '',
      location: '',
      description: '',
    })
  }

  // Convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  // Handle publish discovery
  const handlePublishDiscovery = async () => {
    if (!analysisResult || !translatedText) {
      alert('Please analyze an image first')
      return
    }

    if (!publishForm.site_name || !translatedText) {
      alert('Please fill in required fields (Site Name and Translated Text)')
      return
    }

    if (!user) {
      alert('Please log in to publish')
      return
    }

    setIsPublishing(true)

    try {
      let imageUrl: string | undefined = undefined

      // Upload image if it's a data URL (captured/uploaded image)
      const imageToUpload = capturedImage || uploadedImage
      if (imageToUpload && imageToUpload.startsWith('data:')) {
        try {
          const file = dataURLtoFile(imageToUpload, `discovery-${Date.now()}.png`)
          imageUrl = await uploadPhoto(file, user.id, 'community-discoveries')
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          alert('Failed to upload image. Please try again.')
          setIsPublishing(false)
          return
        }
      } else if (imageToUpload) {
        // If it's already a URL, use it directly
        imageUrl = imageToUpload
      }

      await createCommunityDiscovery({
        type: 'discovery',
        site_name: publishForm.site_name,
        location: publishForm.location || undefined,
        original_text: originalText || analysisResult.originalText,
        translated_text: translatedText || analysisResult.translatedText,
        description: publishForm.description || undefined,
        image_url: imageUrl,
        video_url: videoHistory === 'generated' ? 'generated' : undefined,
      })

      alert('Discovery published successfully!')
      setIsPublishOpen(false)
      setPublishForm({
        site_name: '',
        location: '',
        description: '',
      })
      // Optionally navigate to community page
      // navigate('/community')
    } catch (error) {
      console.error('Error publishing discovery:', error)
      alert('Failed to publish discovery. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Open publish dialog with pre-filled data
  const handleOpenPublish = () => {
    if (!analysisResult) {
      alert('Please analyze an image first')
      return
    }
    
    // Pre-fill form with analysis data
    setPublishForm({
      site_name: publishForm.site_name || 'Monument Discovery',
      location: publishForm.location || '',
      description: publishForm.description || '',
    })
    setIsPublishOpen(true)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Sparkles className="w-6 h-6 text-purple-800" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Brahmi - Lens of Time</h1>
                  <p className="text-gray-600 text-sm">AI-powered monument analysis with TrOCR + Phi-3</p>
                </div>
              </div>
              {(isCameraActive || analysisResult) && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Camera & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Camera Section */}
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Lens of Time Camera
                  </h2>
                  <div className="flex gap-2">
                    {!isCameraActive ? (
                      <Button
                        onClick={startCamera}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                      >
                        <CameraOff className="w-4 h-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Camera View */}
                {isCameraActive && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border-2 border-gray-200"
                      style={{ maxHeight: '500px', objectFit: 'contain' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>Processing with TrOCR + Phi-3...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button
                        onClick={captureImage}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16"
                      >
                        <Camera className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Captured/Uploaded Image */}
                {(capturedImage || uploadedImage) && !isCameraActive && (
                  <div className="relative">
                    <img
                      src={capturedImage || uploadedImage || ''}
                      alt="Captured"
                      className="w-full rounded-lg border-2 border-gray-200"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>Analyzing with TrOCR + Phi-3...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Camera/Image State */}
                {!isCameraActive && !capturedImage && !uploadedImage && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Start camera or upload an image</p>
                    <p className="text-sm text-gray-500">Point at inscriptions or monuments to analyze</p>
                  </div>
                )}
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <Card className="p-6 bg-background/80 backdrop-blur-xl border-2">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    Analysis Results
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block font-semibold">Original Text (Detected)</Label>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.originalText}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block font-semibold">Translation</Label>
                      <div className="bg-purple-50 rounded-lg p-4 max-h-48 overflow-y-auto border border-purple-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.translatedText}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleGenerateTTS}
                        variant="outline"
                        className="flex-1"
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Play Audio
                      </Button>
                      <Button
                        onClick={handleGenerateVideoHistory}
                        disabled={isProcessing || videoHistory === 'generated'}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {videoHistory === 'generated' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Video Ready
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Generate Video History
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={handleOpenPublish}
                      className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Publish to Community
                    </Button>

                    {videoHistory === 'generated' && (
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">AI-Generated Video History</p>
                          <p className="text-xs text-gray-400 mt-1">Ready to play</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Contextual Chatbot */}
            <div className="space-y-6">
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 flex flex-col h-[calc(100vh-12rem)]">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Contextual AI Chat
                </h2>
                
                {!analysisResult ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Analyze a monument first</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Capture or upload an image to start chatting with AI
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {isChatting && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask about the monument..."
                        className="flex-1"
                      />
                      <Button
                        onClick={handleChatSend}
                        disabled={!chatInput.trim() || isChatting}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

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
                      value={originalText || analysisResult?.originalText || ''}
                      readOnly
                      className="w-full min-h-[100px] p-3 border rounded-lg resize-y bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="translated_text">Translated Text *</Label>
                    <textarea
                      id="translated_text"
                      value={translatedText || analysisResult?.translatedText || ''}
                      readOnly
                      className="w-full min-h-[120px] p-3 border rounded-lg resize-y bg-purple-50"
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
                  {(capturedImage || uploadedImage) && (
                    <div>
                      <Label>Preview Image</Label>
                      <img
                        src={capturedImage || uploadedImage || ''}
                        alt="Preview"
                        className="w-full rounded-lg border-2 border-gray-200 mt-2"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t">
                  <Button variant="outline" onClick={() => setIsPublishOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePublishDiscovery}
                    disabled={isPublishing || !publishForm.site_name || !translatedText}
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

      <Footer />
    </div>
  )
}

export default StoryVideo
