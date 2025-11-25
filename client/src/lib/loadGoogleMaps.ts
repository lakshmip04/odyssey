// Google Maps API loader utility

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

let isLoaded = false
let isLoading = false
let loadPromise: Promise<void> | null = null

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined'
}

export function loadGoogleMaps(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve()
  }

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('Google Maps API key not found. Add VITE_GOOGLE_MAPS_API_KEY to your .env file')
    isLoading = false
    return Promise.reject(new Error('Google Maps API key not configured'))
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists and Google Maps is loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Check if Google Maps is already loaded
      if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
        isLoaded = true
        isLoading = false
        resolve()
        return
      }
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        // Wait a bit for the callback to execute
        setTimeout(() => {
          if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
            isLoaded = true
            isLoading = false
            resolve()
          } else {
            isLoading = false
            reject(new Error('Google Maps API failed to load'))
          }
        }, 100)
      })
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=initGoogleMaps`
    script.async = true
    script.defer = true

    // Set up callback
    window.initGoogleMaps = () => {
      if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
        isLoaded = true
        isLoading = false
        console.log('✅ Google Maps API loaded successfully')
        resolve()
      } else {
        isLoading = false
        reject(new Error('Google Maps API loaded but google.maps is undefined'))
      }
    }

    script.onerror = () => {
      isLoading = false
      isLoaded = false
      reject(new Error('Failed to load Google Maps API'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

// Declare the callback function
declare global {
  interface Window {
    initGoogleMaps: () => void
  }
}

