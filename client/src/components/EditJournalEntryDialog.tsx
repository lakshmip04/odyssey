import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Languages, Loader2, Upload, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { TravelJournalEntry, updateJournalEntry } from '../lib/travelJournalApi'
import { uploadPhotos, deletePhoto, isSupabaseStorageUrl } from '../lib/storageApi'
import { supabase } from '../lib/supabaseClient'

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
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])

  useEffect(() => {
    if (entry) {
      setNotes(entry.notes || '')
      setPhotos(entry.photos || [])
      setAiTranslations(entry.ai_translations || null)
      setPhotosToDelete([]) // Reset photos to delete when entry changes
    }
  }, [entry])

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
      // Mock AI translation - replace with actual API call
      // This simulates generating translations for the site
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTranslations = {
        site_name: {
          original: entry.site_name,
          translations: {
            hindi: entry.site_name, // In real app, this would be translated
            spanish: entry.site_name,
            french: entry.site_name,
          }
        },
        description: {
          original: 'A beautiful heritage site with rich history',
          translations: {
            hindi: 'समृद्ध इतिहास के साथ एक सुंदर विरासत स्थल',
            spanish: 'Un hermoso sitio patrimonial con rica historia',
            french: 'Un magnifique site patrimonial avec une riche histoire',
          }
        },
        common_phrases: {
          'How do I get there?': {
            hindi: 'मैं वहां कैसे पहुंचूं?',
            spanish: '¿Cómo llego allí?',
            french: 'Comment y arriver?',
          },
          'What is the history?': {
            hindi: 'इतिहास क्या है?',
            spanish: '¿Cuál es la historia?',
            french: "Quelle est l'histoire?",
          },
        },
        generated_at: new Date().toISOString(),
      }

      setAiTranslations(mockTranslations)
    } catch (error) {
      console.error('Error generating translations:', error)
      alert('Failed to generate translations. Please try again.')
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
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Edit Journal Entry</h2>
                  <p className="text-sm text-muted-foreground mt-1">{entry.site_name}</p>
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

                {/* AI Translations Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">
                      AI Translations
                    </Label>
                    {!aiTranslations && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateTranslation}
                        disabled={isGeneratingTranslation}
                      >
                        {isGeneratingTranslation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Languages className="w-4 h-4 mr-2" />
                            Generate Translations
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {aiTranslations ? (
                    <div className="p-4 bg-[#BEF265]/10 rounded-lg border border-[#BEF265]/30 space-y-3">
                      {Object.entries(aiTranslations).map(([key, value]) => {
                        if (key === 'generated_at') return null
                        if (typeof value === 'object' && value !== null && 'translations' in value) {
                          return (
                            <div key={key} className="space-y-2">
                              <p className="text-sm font-semibold text-green-800 capitalize">{key.replace('_', ' ')}</p>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">Original: {value.original}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {Object.entries(value.translations).map(([lang, translation]) => (
                                    <div key={lang} className="text-xs">
                                      <span className="font-medium capitalize">{lang}:</span>{' '}
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
                              <p className="text-sm font-semibold text-green-800 capitalize">{key.replace('_', ' ')}</p>
                              {Object.entries(value).map(([phrase, translations]) => (
                                <div key={phrase} className="text-xs space-y-1">
                                  <p className="font-medium text-gray-800">{phrase}</p>
                                  <div className="pl-2 space-y-0.5">
                                    {Object.entries(translations as Record<string, string>).map(([lang, translation]) => (
                                      <p key={lang}>
                                        <span className="font-medium capitalize">{lang}:</span>{' '}
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
                      {aiTranslations.generated_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Generated: {new Date(aiTranslations.generated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-dashed text-center">
                      <Languages className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Generate AI translations for this site
                      </p>
                      <p className="text-xs text-gray-500">
                        Get translations of site information and common phrases in multiple languages
                      </p>
                    </div>
                  )}
                </div>
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

