import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2, X, Bot, User } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { chatAboutPlace, type PlaceInfo, type GeminiChatMessage } from '../lib/geminiApi'

interface JournalEntryChatProps {
  entryId: string
  placeInfo: PlaceInfo
  isOpen: boolean
  onClose: () => void
}

const JournalEntryChat = ({ entryId, placeInfo, isOpen, onClose }: JournalEntryChatProps) => {
  const [chatHistory, setChatHistory] = useState<GeminiChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    try {
      const { response, updatedHistory } = await chatAboutPlace(
        placeInfo,
        chatHistory,
        userMessage
      )

      setChatHistory(updatedHistory)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      let userFriendlyMessage = 'Sorry, I encountered an error. '
      if (errorMsg.includes('Rate limit') || errorMsg.includes('quota')) {
        userFriendlyMessage += 'Rate limit exceeded. Please wait a few minutes and try again.'
      } else if (errorMsg.includes('API key')) {
        userFriendlyMessage += 'Please make sure VITE_GEMINI_API_KEY is configured.'
      } else {
        userFriendlyMessage += errorMsg
      }
      
      const errorMessage: GeminiChatMessage = {
        role: 'model',
        content: userFriendlyMessage,
      }
      setChatHistory([...chatHistory, { role: 'user', content: userMessage }, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

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

          {/* Chat Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-background">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Chat about {placeInfo.recognizedPlace}</h3>
                    <p className="text-xs text-gray-500">{placeInfo.country}</p>
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

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Ask me anything about {placeInfo.recognizedPlace}!
                    </p>
                    <p className="text-xs text-gray-500">
                      I can help with history, culture, travel tips, and more.
                    </p>
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about this place..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default JournalEntryChat

