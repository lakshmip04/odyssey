// API service for Google Places and OpenTripMap

export interface HeritageSite {
  id: string
  name: string
  description?: string
  location: {
    lat: number
    lng: number
  }
  address?: string
  rating?: number
  photos?: string[]
  category?: string
  wikipedia?: string
  heritageType?: 'UNESCO' | 'National' | 'Regional' | 'Local'
}

export interface LocationSuggestion {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

// Google Places API - Search for heritage sites
export async function searchHeritageSites(
  location: string,
  apiKey?: string
): Promise<HeritageSite[]> {
  // For now, return mock data
  // In production, integrate with Google Places API
  // You'll need: VITE_GOOGLE_PLACES_API_KEY in .env
  
  const mockSites: HeritageSite[] = [
    {
      id: '1',
      name: 'Kashi Vishwanath Temple',
      description: 'One of the most famous Hindu temples dedicated to Lord Shiva',
      location: { lat: 25.3107, lng: 83.0104 },
      address: 'Vishwanath Gali, Varanasi, Uttar Pradesh',
      rating: 4.7,
      category: 'Religious Heritage',
      heritageType: 'National',
      photos: []
    },
    {
      id: '2',
      name: 'Sarnath Archaeological Site',
      description: 'Where Buddha delivered his first sermon',
      location: { lat: 25.3811, lng: 83.0214 },
      address: 'Sarnath, Varanasi, Uttar Pradesh',
      rating: 4.6,
      category: 'Buddhist Heritage',
      heritageType: 'UNESCO',
      photos: []
    },
    {
      id: '3',
      name: 'Ghats of Varanasi',
      description: 'Historic riverfront steps along the Ganges',
      location: { lat: 25.3176, lng: 83.0104 },
      address: 'Ganga Ghats, Varanasi',
      rating: 4.8,
      category: 'Cultural Heritage',
      heritageType: 'National',
      photos: []
    },
    {
      id: '4',
      name: 'Ramnagar Fort',
      description: '18th-century fort and museum',
      location: { lat: 25.2800, lng: 83.0300 },
      address: 'Ramnagar, Varanasi',
      rating: 4.3,
      category: 'Historical Heritage',
      heritageType: 'Regional',
      photos: []
    },
    {
      id: '5',
      name: 'Bharat Kala Bhavan Museum',
      description: 'Museum showcasing Indian art and artifacts',
      location: { lat: 25.2677, lng: 82.9914 },
      address: 'Banaras Hindu University, Varanasi',
      rating: 4.4,
      category: 'Museum',
      heritageType: 'Regional',
      photos: []
    }
  ]

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  return mockSites
}

// Google Places Autocomplete
export async function getLocationSuggestions(
  query: string,
  apiKey?: string
): Promise<LocationSuggestion[]> {
  // Mock suggestions
  const suggestions: LocationSuggestion[] = [
    {
      place_id: '1',
      description: 'Varanasi, Uttar Pradesh, India',
      main_text: 'Varanasi',
      secondary_text: 'Uttar Pradesh, India'
    },
    {
      place_id: '2',
      description: 'Varanasi Railway Station, Varanasi, India',
      main_text: 'Varanasi Railway Station',
      secondary_text: 'Varanasi, India'
    }
  ]

  if (query.toLowerCase().includes('varanasi')) {
    return suggestions
  }

  return []
}

// OpenTripMap API - Get heritage sites by location
export async function getHeritageSitesFromOpenTripMap(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<HeritageSite[]> {
  // Mock implementation
  // In production, use: https://opentripmap.io/docs
  // You'll need: VITE_OPENTRIPMAP_API_KEY in .env
  
  return []
}

