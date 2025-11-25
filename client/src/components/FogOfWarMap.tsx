import { useEffect, useRef, useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { loadGoogleMaps, isGoogleMapsLoaded } from '../lib/loadGoogleMaps'
import { getWorldCountriesGeoJSON, getCountryGeoJSON, getBoundsFromFeature } from '../lib/geojsonApi'
import { getAllCountries, getCountryCodeFromName } from '../lib/locationData'

interface FogOfWarMapProps {
  visitedLocations?: Array<{
    lat: number
    lng: number
    name?: string
    visitedAt?: string
    country?: string
    state?: string
  }>
  viewMode?: 'world' | 'country' | 'state'
  selectedCountry?: string | null
  selectedState?: string | null
  className?: string
}

const FogOfWarMap = ({ 
  visitedLocations = [], 
  viewMode = 'world',
  selectedCountry = null,
  selectedState = null,
  className = '' 
}: FogOfWarMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const dataLayerRef = useRef<google.maps.Data | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const circlesRef = useRef<google.maps.Circle[]>([])
  const [_isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [worldGeoJSON, setWorldGeoJSON] = useState<any>(null)
  const [countryGeoJSON, setCountryGeoJSON] = useState<any>(null)
  const [countriesList, setCountriesList] = useState<Array<{ name: string; isoCode: string }>>([])

  // Extract visited country codes from visited locations
  const getVisitedCountryCodes = () => {
    const codes = new Set<string>()
    visitedLocations.forEach(loc => {
      if (loc.country) {
        const code = getCountryCodeFromName(loc.country)
        if (code) {
          codes.add(code.toUpperCase())
          console.log(`Marking country as visited: ${loc.country} -> ${code.toUpperCase()}`)
        } else {
          console.warn(`Could not find country code for: ${loc.country}`)
        }
      }
    })
    console.log('Visited country codes:', Array.from(codes))
    return codes
  }

  // Initialize Google Maps and load GeoJSON
  useEffect(() => {
    if (!mapRef.current) return

    let isMounted = true

    const initMap = async () => {
      try {
        setIsLoading(true)
        
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMaps()
        }

        if (!isMounted) return

        if (!isGoogleMapsLoaded()) {
          setMapError('Google Maps API not loaded')
          setIsLoading(false)
          return
        }

        // Load countries list for code mapping
        const countries = getAllCountries()
        setCountriesList(countries.map(c => ({ name: c.name, isoCode: c.isoCode })))

        // Load world countries GeoJSON
        const worldGeo = await getWorldCountriesGeoJSON()
        if (worldGeo) {
          console.log('Loaded world GeoJSON with', worldGeo.features?.length || 0, 'features')
          setWorldGeoJSON(worldGeo)
        } else {
          console.error('Failed to load world GeoJSON')
        }

        // Create map with light theme
        const map = new google.maps.Map(mapRef.current!, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'administrative',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        mapInstanceRef.current = map

        // Wait for map to be fully loaded before adding data layer
        google.maps.event.addListenerOnce(map, 'idle', () => {
          // Initialize Data Layer for GeoJSON
          const dataLayer = new google.maps.Data()
          dataLayer.setMap(map)
          dataLayerRef.current = dataLayer
          
          console.log('Data layer initialized')
          
          if (isMounted) {
            setIsLoading(false)
            setMapError(null)
          }
        })
      } catch (error) {
        console.error('Error initializing map:', error)
        if (isMounted) {
          setMapError('Failed to initialize map')
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [])

  // Load country GeoJSON when country is selected
  useEffect(() => {
    if (!worldGeoJSON || !selectedCountry || viewMode !== 'country') {
      setCountryGeoJSON(null)
      return
    }

    const countryCode = getCountryCodeFromName(selectedCountry)
    if (countryCode) {
      const countryGeo = getCountryGeoJSON(worldGeoJSON, countryCode)
      setCountryGeoJSON(countryGeo)
      
      // Zoom to country bounds
      if (countryGeo && countryGeo.features[0] && mapInstanceRef.current) {
        const bounds = getBoundsFromFeature(countryGeo.features[0])
        if (bounds) {
          mapInstanceRef.current.fitBounds(bounds, 50)
        }
      }
    }
  }, [selectedCountry, worldGeoJSON, viewMode, countriesList])

  // Render world countries with visited countries colored yellow
  useEffect(() => {
    if (!dataLayerRef.current || !worldGeoJSON || viewMode !== 'world' || !mapInstanceRef.current) {
      console.log('World map render conditions:', {
        hasDataLayer: !!dataLayerRef.current,
        hasGeoJSON: !!worldGeoJSON,
        viewMode,
        hasMap: !!mapInstanceRef.current
      })
      return
    }

    const dataLayer = dataLayerRef.current
    const visitedCountryCodes = getVisitedCountryCodes()
    console.log('Rendering world map with', visitedCountryCodes.size, 'visited countries')

    // Clear existing data
    dataLayer.forEach((feature) => {
      dataLayer.remove(feature)
    })

    // Add world countries
    try {
      // First, set the style function before adding data
      dataLayer.setStyle((feature) => {
        const isoA2 = feature.getProperty('ISO_A2') || feature.getProperty('ISO2') || feature.getProperty('ADM0_A2')
        const isoA3 = feature.getProperty('ISO_A3') || feature.getProperty('ISO3') || feature.getProperty('ADM0_A3')
        const iso = (isoA2 || isoA3 || '').toString().toUpperCase()
        
        const isVisited = visitedCountryCodes.has(iso)
        
        // Debug logging for first few features
        if (feature.getProperty('NAME') && Math.random() < 0.01) {
          console.log(`Country: ${feature.getProperty('NAME')}, ISO: ${iso}, Visited: ${isVisited}`)
        }

        return {
          fillColor: isVisited ? '#FDE047' : '#E5E5E5', // Light gray for unvisited, yellow for visited
          fillOpacity: isVisited ? 0.7 : 0.3, // Make unvisited countries slightly visible
          strokeColor: isVisited ? '#FACC15' : '#999',
          strokeWeight: isVisited ? 2 : 1,
          strokeOpacity: isVisited ? 0.8 : 0.5,
          clickable: true,
        }
      })
      
      // Then add the GeoJSON
      const features = dataLayer.addGeoJson(worldGeoJSON)
      console.log('Added', features.length, 'country features to map')
    } catch (error) {
      console.error('Error adding GeoJSON to map:', error)
      return
    }

    // Click handler: switch to country view
    dataLayer.addListener('click', (event: any) => {
      const feature = event.feature
      const isoA2 = feature.getProperty('ISO_A2') || feature.getProperty('ISO2') || feature.getProperty('ADM0_A2')
      const isoA3 = feature.getProperty('ISO_A3') || feature.getProperty('ISO3')
      const iso = (isoA2 || isoA3 || '').toString().toUpperCase()
      
      // Find country name from code
      const country = countriesList.find(c => 
        c.isoCode.toUpperCase() === iso
      )
      
      if (country) {
        // Trigger parent to switch to country view
        // This would be handled by parent component
        console.log('Country clicked:', country.name)
      }
    })

    // Reset zoom for world view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 20, lng: 0 })
      mapInstanceRef.current.setZoom(2)
    }
  }, [worldGeoJSON, viewMode, visitedLocations, countriesList])

  // Render country boundaries and city markers for country view
  useEffect(() => {
    if (!dataLayerRef.current || !mapInstanceRef.current || viewMode !== 'country' || !selectedCountry) return

    const dataLayer = dataLayerRef.current
    const map = mapInstanceRef.current

    // Clear existing data
    dataLayer.forEach((feature) => {
      dataLayer.remove(feature)
    })

    // Add country boundary
    if (countryGeoJSON) {
      dataLayer.addGeoJson(countryGeoJSON)
      dataLayer.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        strokeColor: '#333',
        strokeWeight: 2,
        strokeOpacity: 0.5,
      })
    }

    // Clear existing markers and circles
    markersRef.current.forEach(marker => marker.setMap(null))
    circlesRef.current.forEach(circle => circle.setMap(null))
    markersRef.current = []
    circlesRef.current = []

    // Filter cities in selected country
    const countryCities = visitedLocations.filter(loc => loc.country === selectedCountry)
    
    // Group cities by state to identify visited states
    const visitedStates = new Set<string>()
    countryCities.forEach(loc => {
      if (loc.state) {
        visitedStates.add(loc.state)
      }
    })
    
    console.log(`Country view: ${countryCities.length} cities in ${selectedCountry}, ${visitedStates.size} states visited`)

    // Add markers for visited cities
    countryCities.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FDE047',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: location.name || 'Visited location',
        animation: google.maps.Animation.DROP,
      })

      // Yellow circle around city
      const circle = new google.maps.Circle({
        strokeColor: '#FDE047',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: '#FDE047',
        fillOpacity: 0.2,
        map: map,
        center: { lat: location.lat, lng: location.lng },
        radius: 20000, // 20km radius
      })

      markersRef.current.push(marker)
      circlesRef.current.push(circle)

      // Info window
      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${location.name || 'Visited Location'}</h3>
              ${location.state ? `<p style="margin: 0; color: #666; font-size: 12px;">${location.state}</p>` : ''}
              ${location.visitedAt ? `<p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">Visited: ${new Date(location.visitedAt).toLocaleDateString()}</p>` : ''}
            </div>
          `,
        })
        infoWindow.open(map, marker)
      })
    })

    // Fit bounds to show all cities
    if (countryCities.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      countryCities.forEach(loc => {
        bounds.extend({ lat: loc.lat, lng: loc.lng })
      })
      map.fitBounds(bounds, 50)
    }
  }, [countryGeoJSON, viewMode, selectedCountry, selectedState, visitedLocations])

  // Render state view with city markers
  useEffect(() => {
    if (!mapInstanceRef.current || viewMode !== 'state' || !selectedCountry || !selectedState) return

    const map = mapInstanceRef.current

    // Clear existing markers and circles
    markersRef.current.forEach(marker => marker.setMap(null))
    circlesRef.current.forEach(circle => circle.setMap(null))
    markersRef.current = []
    circlesRef.current = []

    // Filter cities in selected state
    const stateCities = visitedLocations.filter(
      loc => loc.country === selectedCountry && loc.state === selectedState
    )

    // Add markers for visited cities
    stateCities.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#FDE047',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: location.name || 'Visited location',
        animation: google.maps.Animation.DROP,
      })

      // Yellow circle around city
      const circle = new google.maps.Circle({
        strokeColor: '#FDE047',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: '#FDE047',
        fillOpacity: 0.3,
        map: map,
        center: { lat: location.lat, lng: location.lng },
        radius: 15000, // 15km radius
      })

      markersRef.current.push(marker)
      circlesRef.current.push(circle)

      // Info window
      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${location.name || 'Visited Location'}</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">${selectedState}</p>
              ${location.visitedAt ? `<p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">Visited: ${new Date(location.visitedAt).toLocaleDateString()}</p>` : ''}
            </div>
          `,
        })
        infoWindow.open(map, marker)
      })
    })

    // Fit bounds to show all cities in state
    if (stateCities.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      stateCities.forEach(loc => {
        bounds.extend({ lat: loc.lat, lng: loc.lng })
      })
      map.fitBounds(bounds, 50)
    } else if (stateCities.length === 0 && mapInstanceRef.current) {
      // If no cities, zoom to a default state view (you might want to get state bounds from GeoJSON)
      map.setZoom(8)
    }
  }, [viewMode, selectedCountry, selectedState, visitedLocations])

  if (mapError) {
    return (
      <div className={`w-full h-full rounded-lg relative overflow-hidden bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-1">Fog of War Map</p>
          <p className="text-xs text-gray-500">
            {visitedLocations.length > 0 
              ? `${visitedLocations.length} regions discovered`
              : 'Explore to uncover the world'
            }
          </p>
        </div>
      </div>
    )
  }

  if (!isGoogleMapsLoaded() && !mapError) {
    return (
      <div className={`w-full h-full rounded-lg relative overflow-hidden bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FDE047] mx-auto mb-2" />
          <p className="text-xs text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }

  const visitedCountryCodes = getVisitedCountryCodes()
  const uncoveredCount = viewMode === 'world' 
    ? visitedCountryCodes.size 
    : visitedLocations.filter(loc => {
        if (viewMode === 'country') return loc.country === selectedCountry
        if (viewMode === 'state') return loc.country === selectedCountry && loc.state === selectedState
        return false
      }).length

  // Only show empty state if there are truly no visited locations
  const hasVisitedLocations = viewMode === 'world' 
    ? visitedCountryCodes.size > 0
    : viewMode === 'country'
    ? visitedLocations.some(loc => loc.country === selectedCountry)
    : visitedLocations.some(loc => loc.country === selectedCountry && loc.state === selectedState)

  return (
    <div className={`w-full h-full rounded-lg relative overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Stats Overlay */}
      {hasVisitedLocations && (
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-[#FDE047] z-20 shadow-lg">
          <div className="font-semibold">
            {viewMode === 'world' 
              ? `${uncoveredCount} ${uncoveredCount === 1 ? 'country' : 'countries'} uncovered`
              : `${uncoveredCount} ${uncoveredCount === 1 ? 'location' : 'locations'} visited`
            }
          </div>
        </div>
      )}

      {/* Empty State - only show if no visited locations */}
      {!hasVisitedLocations && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center bg-black/50 backdrop-blur-sm px-6 py-4 rounded-lg">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">
              {viewMode === 'world' 
                ? 'Mark trips as completed to uncover countries'
                : viewMode === 'country'
                ? selectedCountry 
                  ? `No locations visited in ${selectedCountry}. Complete a trip in this country to see it on the map.`
                  : 'Select a country to view visited locations'
                : selectedState
                ? `No locations visited in ${selectedState}. Complete a trip in this state to see it on the map.`
                : 'Select a state to view visited locations'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FogOfWarMap
