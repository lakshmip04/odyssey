// Reverse geocoding utility to get country and state from coordinates
// Uses Google Maps Geocoding API

import { loadGoogleMaps, isGoogleMapsLoaded } from './loadGoogleMaps'

export interface ReverseGeocodeResult {
  country?: string
  state?: string
  city?: string
  formattedAddress?: string
}

// Reverse geocode coordinates to get country and state
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    // Ensure Google Maps is loaded
    if (!isGoogleMapsLoaded()) {
      await loadGoogleMaps()
    }

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      console.warn('Google Maps Geocoder not available')
      return {}
    }

    const geocoder = new google.maps.Geocoder()
    const latlng = { lat, lng }

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const result = results[0]
          const addressComponents = result.address_components || []
          
          let country: string | undefined
          let state: string | undefined
          let city: string | undefined

          // Extract country, state, and city from address components
          addressComponents.forEach((component) => {
            const types = component.types

            if (types.includes('country')) {
              country = component.long_name
            }

            // State/Province can be: administrative_area_level_1, political
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name
            }

            // City can be: locality, administrative_area_level_2
            if (types.includes('locality')) {
              city = component.long_name
            } else if (!city && types.includes('administrative_area_level_2')) {
              city = component.long_name
            }
          })

          console.log(`Reverse geocoded (${lat}, ${lng}):`, { country, state, city })

          resolve({
            country,
            state,
            city,
            formattedAddress: result.formatted_address,
          })
        } else {
          console.warn(`Geocoding failed for (${lat}, ${lng}):`, status)
          resolve({})
        }
      })
    })
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    return {}
  }
}

// Batch reverse geocode multiple coordinates
export async function batchReverseGeocode(
  coordinates: Array<{ lat: number; lng: number }>
): Promise<ReverseGeocodeResult[]> {
  const results: ReverseGeocodeResult[] = []
  
  // Process with a small delay between requests to avoid rate limiting
  for (const coord of coordinates) {
    const result = await reverseGeocode(coord.lat, coord.lng)
    results.push(result)
    
    // Small delay to avoid rate limiting (100ms between requests)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

