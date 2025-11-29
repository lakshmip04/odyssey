// Gemini AI API integration for travel journal

export interface PlaceInfo {
  recognizedPlace: string
  country: string
  language: string
  phrases: Array<{
    english: string
    local: string
    pronunciation?: string
  }>
  famousThings: string[]
  culturalTips?: string[]
}

export interface GeminiChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface GeminiResponse {
  placeInfo: PlaceInfo
  chatHistory?: GeminiChatMessage[]
}

// Initialize Gemini client
// Note: In production, you'll need to set up a backend proxy for the API key
// For now, we'll use environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
// Use gemini-3-pro-preview or gemini-2.0-flash-exp based on availability
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Generate place information using Gemini
export async function generatePlaceInfo(
  siteName: string,
  locationName?: string,
  country?: string,
  notes?: string
): Promise<PlaceInfo> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.')
  }

  const prompt = `You are a travel assistant. Analyze this travel journal entry and provide helpful information:

Site Name: ${siteName}
Location: ${locationName || 'Unknown'}
Country: ${country || 'Unknown'}
Notes: ${notes || 'No additional notes'}

Please provide:
1. The recognized place name (official/local name)
2. The country where this place is located
3. The primary language spoken in this place
4. 5-7 useful travel phrases in that language (English phrase, local translation, and pronunciation guide)
5. 5-7 famous things about this place (monuments, food, culture, history, etc.)
6. Optional cultural tips or etiquette

Format your response as JSON with this structure:
{
  "recognizedPlace": "official name",
  "country": "country name",
  "language": "language name",
  "phrases": [
    {"english": "Hello", "local": "translation", "pronunciation": "pronunciation guide"}
  ],
  "famousThings": ["thing 1", "thing 2"],
  "culturalTips": ["tip 1", "tip 2"]
}

Only return valid JSON, no additional text.`

  // Retry logic for rate limits
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check if it's a rate limit error (429)
        if (response.status === 429) {
          const retryAfter = errorData.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
          
          if (attempt < maxRetries - 1) {
            console.log(`Rate limit hit, retrying after ${waitTime}ms...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          } else {
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again. You may need to upgrade your Gemini API plan or wait for quota reset.')
          }
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini')
      }

      const placeInfo: PlaceInfo = JSON.parse(jsonMatch[0])
      return placeInfo
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If it's a rate limit error and we have retries left, continue
      if (error instanceof Error && error.message.includes('Rate limit') && attempt < maxRetries - 1) {
        continue
      }
      
      // For other errors or final attempt, throw
      if (attempt === maxRetries - 1) {
        throw lastError
      }
    }
  }

  throw lastError || new Error('Failed to generate place information after retries')
}

// Chat with Gemini about a specific place
export async function chatAboutPlace(
  placeInfo: PlaceInfo,
  chatHistory: GeminiChatMessage[],
  userMessage: string
): Promise<{ response: string; updatedHistory: GeminiChatMessage[] }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  const contextPrompt = `You are a travel assistant helping someone learn about ${placeInfo.recognizedPlace} in ${placeInfo.country}.

Place Information:
- Language: ${placeInfo.language}
- Famous Things: ${placeInfo.famousThings.join(', ')}
${placeInfo.culturalTips ? `- Cultural Tips: ${placeInfo.culturalTips.join(', ')}` : ''}

Previous conversation:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's question: ${userMessage}

Please provide a helpful, concise answer about this place.`

  // Retry logic for rate limits
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: contextPrompt
            }]
          }]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check if it's a rate limit error (429)
        if (response.status === 429) {
          const retryAfter = errorData.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
          
          if (attempt < maxRetries - 1) {
            console.log(`Rate limit hit, retrying after ${waitTime}ms...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          } else {
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.')
          }
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'

      const updatedHistory: GeminiChatMessage[] = [
        ...chatHistory,
        { role: 'user', content: userMessage },
        { role: 'model', content: aiResponse },
      ]

      return {
        response: aiResponse,
        updatedHistory,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If it's a rate limit error and we have retries left, continue
      if (error instanceof Error && error.message.includes('Rate limit') && attempt < maxRetries - 1) {
        continue
      }
      
      // For other errors or final attempt, throw
      if (attempt === maxRetries - 1) {
        throw lastError
      }
    }
  }

  throw lastError || new Error('Failed to get chat response after retries')
}

