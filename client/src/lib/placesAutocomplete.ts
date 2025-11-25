// Google Places Autocomplete utility

declare global {
  interface Window {
    google: typeof google
  }
}

export interface AutocompletePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
  rating?: number
  photos?: Array<{
    getUrl: (options?: { maxWidth?: number; maxHeight?: number }) => string
  }>
  types?: string[]
}

// Initialize Places Autocomplete
export function initPlacesAutocomplete(
  input: HTMLInputElement,
  onPlaceSelected: (place: PlaceDetails) => void,
  options?: {
    types?: string[]
    componentRestrictions?: { country?: string | string[] }
  }
): google.maps.places.Autocomplete | null {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps Places API not loaded')
    return null
  }

  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: options?.types || ['(cities)'],
    componentRestrictions: options?.componentRestrictions ? {
      country: options.componentRestrictions.country || null
    } : undefined,
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'photos', 'types'],
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace() as PlaceDetails
    
    if (place.geometry && place.geometry.location) {
      onPlaceSelected(place)
    }
  })

  return autocomplete
}

// Get place details by place_id
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    return null
  }

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    )

    service.getDetails(
      {
        placeId: placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'photos',
          'types',
          'formatted_phone_number',
          'website',
          'opening_hours',
        ],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry
        ) {
          resolve(place as PlaceDetails)
        } else {
          resolve(null)
        }
      }
    )
  })
}

// Search for places (heritage sites, monuments, etc.)
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceDetails[]> {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    return []
  }

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    )

    const request: google.maps.places.TextSearchRequest = {
      query: query,
      type: 'tourist_attraction',
    }

    if (location && radius) {
      request.location = new google.maps.LatLng(location.lat, location.lng)
      request.radius = radius
    }

    service.textSearch(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results
      ) {
        const places: PlaceDetails[] = results.map((result) => ({
          place_id: result.place_id || '',
          name: result.name || '',
          formatted_address: result.formatted_address || '',
          geometry: {
            location: {
              lat: () => result.geometry?.location?.lat() || 0,
              lng: () => result.geometry?.location?.lng() || 0,
            },
          },
          rating: result.rating,
          photos: result.photos,
          types: result.types,
        }))
        resolve(places)
      } else {
        resolve([])
      }
    })
  })
}

