import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { loadGoogleMaps, isGoogleMapsLoaded } from '../lib/loadGoogleMaps'
import { initPlacesAutocomplete, PlaceDetails } from '../lib/placesAutocomplete'

interface LocationSearchProps {
  onLocationSelect: (location: string, placeDetails?: PlaceDetails) => void
  placeholder?: string
}

const LocationSearch = ({ 
  onLocationSelect, 
  placeholder = "Search for a destination (e.g., Varanasi)" 
}: LocationSearchProps) => {
  const [query, setQuery] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Initialize Google Maps and Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!inputRef.current) return

      try {
        setIsInitializing(true)
        
        // Load Google Maps if not already loaded
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMaps()
        }

        if (!isGoogleMapsLoaded() || !inputRef.current) {
          setIsInitializing(false)
          return
        }

        // Initialize Places Autocomplete
        const autocomplete = initPlacesAutocomplete(
          inputRef.current,
          (place) => {
            setQuery(place.formatted_address || place.name)
            onLocationSelect(place.formatted_address || place.name, place)
          },
          {
            types: ['(cities)'],
          }
        )

        if (autocomplete) {
          autocompleteRef.current = autocomplete
        }

        setIsInitializing(false)
      } catch (error) {
        console.error('Error initializing autocomplete:', error)
        setIsInitializing(false)
      }
    }

    initializeAutocomplete()

    return () => {
      // Cleanup if needed
      autocompleteRef.current = null
    }
  }, [])

  const handleSearch = () => {
    if (query.trim()) {
      onLocationSelect(query.trim())
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          placeholder={isInitializing ? "Loading search..." : placeholder}
          disabled={isInitializing}
          className="pl-12 pr-32 h-14 text-base"
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isInitializing}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10"
        >
          {isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {isInitializing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg border border-border">
          Initializing Google Places Autocomplete...
        </div>
      )}
    </div>
  )
}

export default LocationSearch

