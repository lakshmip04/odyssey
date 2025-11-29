import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Languages, Loader2, Upload, Trash2, MessageCircle, Send, Bot, User, Sparkles, MapPin, Globe, BookOpen } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { TravelJournalEntry, updateJournalEntry } from '../lib/travelJournalApi'
import { uploadPhotos, deletePhoto, isSupabaseStorageUrl } from '../lib/storageApi'
import { supabase } from '../lib/supabaseClient'
import { generatePlaceInfo, chatAboutPlace, type PlaceInfo, type GeminiChatMessage } from '../lib/geminiApi'

interface EditJournalEntryDialogProps {
  entry: TravelJournalEntry | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const EditJournalEntryDialog = ({ entry, isOpen, onClose, onSave }: EditJournalEntryDialogProps) => {
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false)
  const [aiTranslations, setAiTranslations] = useState<Record<string, any> | null>(null)
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null)
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'ai-info' | 'chat'>('details')
  const [chatHistory, setChatHistory] = useState<GeminiChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (entry) {
      setNotes(entry.notes || '')
      setPhotos(entry.photos || [])
      setAiTranslations(entry.ai_translations || null)
      setPhotosToDelete([]) // Reset photos to delete when entry changes
      setChatHistory([]) // Reset chat history
      setChatInput('')
      setActiveTab('details')
      
      // Load place info if it exists in ai_translations
      if (entry.ai_translations && entry.ai_translations.placeInfo) {
        setPlaceInfo(entry.ai_translations.placeInfo as PlaceInfo)
        setActiveTab('ai-info') // Switch to AI info tab if available
      }
    }
  }, [entry])

  useEffect(() => {
    if (chatEndRef.current && activeTab === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, activeTab])

  const handleChatSend = async () => {
    if (!chatInput.trim() || !placeInfo || isChatting) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setIsChatting(true)

    try {
      const { response, updatedHistory } = await chatAboutPlace(
        placeInfo,
        chatHistory,
        userMessage
      )
      setChatHistory(updatedHistory)
    } catch (error) {
      console.error('Error sending chat message:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      let userFriendlyMessage = 'Sorry, I encountered an error. '
      if (errorMsg.includes('Rate limit') || errorMsg.includes('quota')) {
        userFriendlyMessage += 'Rate limit exceeded. Please wait a few minutes and try again.'
      } else {
        userFriendlyMessage += errorMsg
      }
      
      const errorMessage: GeminiChatMessage = {
        role: 'model',
        content: userFriendlyMessage,
      }
      setChatHistory([...chatHistory, { role: 'user', content: userMessage }, errorMessage])
    } finally {
      setIsChatting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Filter only image files
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      
      if (imageFiles.length === 0) {
        alert('Please select image files only')
        return
      }

      // Upload photos to Supabase Storage
      const uploadedUrls = await uploadPhotos(imageFiles, user.id, entry?.id)
      
      // Add uploaded URLs to photos array
      setPhotos([...photos, ...uploadedUrls])
      
      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async (index: number) => {
    const photoToRemove = photos[index]
    
    // If it's a Supabase Storage URL, mark it for deletion
    if (isSupabaseStorageUrl(photoToRemove)) {
      setPhotosToDelete([...photosToDelete, photoToRemove])
    }
    
    // Remove from photos array
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
  }

  const handleGenerateTranslation = async () => {
    if (!entry) return

    setIsGeneratingTranslation(true)
    try {
      // Generate place information using Gemini
      const info = await generatePlaceInfo(
        entry.site_name,
        entry.location_name,
        entry.country,
        notes
      )
      
      setPlaceInfo(info)

      // Format translations for storage
      const translations = {
        placeInfo: info,
        recognizedPlace: info.recognizedPlace,
        country: info.country,
        language: info.language,
        phrases: info.phrases,
        famousThings: info.famousThings,
        culturalTips: info.culturalTips || [],
        generated_at: new Date().toISOString(),
      }

      setAiTranslations(translations)
    } catch (error) {
      console.error('Error generating place info:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
        alert(`Rate limit exceeded. Please wait a few minutes before trying again.\n\nTo fix this:\n1. Wait 10-15 minutes for quota reset\n2. Upgrade your Gemini API plan at https://ai.google.dev/pricing\n3. Check your usage at https://ai.dev/usage`)
      } else if (errorMessage.includes('API key')) {
        alert(`API Key Error: ${errorMessage}\n\nPlease make sure VITE_GEMINI_API_KEY is set in your .env file.`)
      } else {
        alert(`Failed to generate place information: ${errorMessage}`)
      }
    } finally {
      setIsGeneratingTranslation(false)
    }
  }

  const handleSave = async () => {
    if (!entry) return

    setIsSaving(true)
    try {
      // Delete photos that were removed
      if (photosToDelete.length > 0) {
        try {
          await Promise.all(photosToDelete.map(url => deletePhoto(url)))
        } catch (error) {
          console.error('Error deleting photos:', error)
          // Continue even if deletion fails
        }
      }

      // Update journal entry with new photos
      await updateJournalEntry(entry.id, {
        notes: notes || undefined,
        photos: photos.length > 0 ? photos : undefined,
        ai_translations: aiTranslations || undefined,
      })
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
      setPhotosToDelete([])
    }
  }

  if (!entry) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-purple-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/80">
                      <BookOpen className="w-5 h-5 text-green-700" />
                    </div>
                <div>
                      <h2 className="text-2xl font-bold text-gray-900">Edit Journal Entry</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{entry.site_name}</span>
                        {entry.location_name && (
                          <>
                            <span>•</span>
                            <span>{entry.location_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex border-b bg-white">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" />
                    Details & Photos
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('ai-info')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'ai-info'
                      ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Place Info
                    {placeInfo && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                      : placeInfo
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!placeInfo}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {!placeInfo && <span className="text-xs">(Generate AI info first)</span>}
                  </div>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                {/* Notes Section */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                    Personal Notes
                  </Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your thoughts, memories, and experiences from this visit..."
                    className="w-full min-h-[120px] p-3 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Photos Section */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Photos
                  </Label>
                  <div className="space-y-4">
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() => handleRemovePhoto(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        disabled={isUploading}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isUploading}
                        onClick={() => {
                          const fileInput = document.getElementById('photo-upload') as HTMLInputElement
                          fileInput?.click()
                        }}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photos
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
                )}

                {activeTab === 'ai-info' && (
                  <div className="p-6 space-y-6">
                    {!placeInfo ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-purple-100 mb-4">
                          <Sparkles className="w-12 h-12 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Generate AI Place Information</h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md">
                          Get intelligent insights about this place including local language phrases, famous attractions, and cultural tips.
                        </p>
                      <Button
                        onClick={handleGenerateTranslation}
                        disabled={isGeneratingTranslation}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isGeneratingTranslation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing Place...
                          </>
                        ) : (
                          <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Place Information
                          </>
                        )}
                      </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Recognized Place Card */}
                        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-white/80">
                              <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-purple-700 mb-1">Recognized Place</p>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{placeInfo.recognizedPlace}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{placeInfo.country}</span>
                                    </div>
                                <div className="flex items-center gap-1">
                                  <Languages className="w-4 h-4" />
                                  <span>{placeInfo.language}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Useful Phrases */}
                        <Card className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Languages className="w-5 h-5 text-green-600" />
                            <h4 className="text-lg font-bold text-gray-900">Useful Phrases in {placeInfo.language}</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {placeInfo.phrases.map((phrase, idx) => (
                              <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                                <p className="text-sm font-semibold text-gray-900 mb-1">{phrase.english}</p>
                                <p className="text-base text-gray-800 mb-1">{phrase.local}</p>
                                {phrase.pronunciation && (
                                  <p className="text-xs text-gray-500 italic">({phrase.pronunciation})</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>

                        {/* Famous Things */}
                        <Card className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                            <h4 className="text-lg font-bold text-gray-900">Famous Things About This Place</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {placeInfo.famousThings.map((thing, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <span className="text-amber-600 font-bold">{idx + 1}.</span>
                                <p className="text-sm text-gray-700 flex-1">{thing}</p>
                              </div>
                                    ))}
                                  </div>
                        </Card>

                        {/* Cultural Tips */}
                        {placeInfo.culturalTips && placeInfo.culturalTips.length > 0 && (
                          <Card className="p-6 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2 mb-4">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                              <h4 className="text-lg font-bold text-gray-900">Cultural Tips</h4>
                                </div>
                            <ul className="space-y-2">
                              {placeInfo.culturalTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <p className="text-sm text-gray-700 flex-1">{tip}</p>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        )}

                        {aiTranslations?.generated_at && (
                          <p className="text-xs text-gray-500 text-center">
                            Generated: {new Date(aiTranslations.generated_at as string).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && placeInfo && (
                  <div className="flex flex-col h-full">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-[400px]">
                      {chatHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="p-4 rounded-full bg-blue-100 mb-4">
                            <Bot className="w-12 h-12 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Ask About {placeInfo.recognizedPlace}</h3>
                          <p className="text-sm text-gray-600 mb-4 max-w-md">
                            I can help you learn more about this place! Ask me about history, culture, food, attractions, or anything else.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
                            {[
                              "What's the best time to visit?",
                              "What should I eat here?",
                              "Tell me about the history",
                              "What are must-see attractions?"
                            ].map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => setChatInput(suggestion)}
                                className="p-2 text-xs bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        chatHistory.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'model' && (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] rounded-2xl p-4 ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="bg-white rounded-2xl p-4 border border-gray-200">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about this place..."
                          disabled={isChatting}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleChatSend}
                          disabled={!chatInput.trim() || isChatting}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isChatting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPhotosToDelete([]) // Reset on cancel
                    onClose()
                  }} 
                  disabled={isSaving || isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="bg-[#BEF265] hover:bg-[#A3E635] text-green-900"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default EditJournalEntryDialog

