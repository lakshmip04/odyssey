import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { loadGoogleMaps, isGoogleMapsLoaded } from '../lib/loadGoogleMaps'

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  sites?: Array<{
    id: string
    name: string
    location: { lat: number; lng: number }
    heritageType?: string
    description?: string
    address?: string
  }>
  onSiteClick?: (siteId: string) => void
}

const MapView = ({ 
  center = { lat: 25.3176, lng: 83.0104 }, 
  zoom = 12,
  sites = [],
  onSiteClick
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [_isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  // Get marker icon based on heritage type
  const getMarkerIcon = (heritageType?: string) => {
    const colors: Record<string, string> = {
      'UNESCO': '#f59e0b', // amber
      'National': '#3b82f6', // blue
      'Regional': '#10b981', // green
    }
    const color = colors[heritageType || ''] || '#6b7280' // gray

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  }

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return

    let isMounted = true

    const initMap = async () => {
      try {
        setIsLoading(true)
        
        // Load Google Maps API if not already loaded
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMaps()
        }

        if (!isMounted) return

        if (!isGoogleMapsLoaded()) {
          setMapError('Google Maps API not loaded. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.')
          setIsLoading(false)
          return
        }

        // Create map instance
        const map = new google.maps.Map(mapRef.current!, {
          center: center,
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        mapInstanceRef.current = map
        console.log('✅ Google Map initialized at:', center, 'zoom:', zoom)

        // Create info window
        infoWindowRef.current = new google.maps.InfoWindow()

        if (isMounted) {
          setIsLoading(false)
          setMapError(null)
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        if (isMounted) {
          setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, []) // Only run once on mount

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center.lat !== 0 && center.lng !== 0) {
      mapInstanceRef.current.setCenter(center)
      mapInstanceRef.current.setZoom(zoom)
    }
  }, [center, zoom])

  // Update markers when sites change
  useEffect(() => {
    if (!mapInstanceRef.current || !isGoogleMapsLoaded()) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Create markers for each site
    sites.forEach((site) => {
      const marker = new google.maps.Marker({
        position: site.location,
        map: mapInstanceRef.current!,
        title: site.name,
        icon: getMarkerIcon(site.heritageType),
        animation: google.maps.Animation.DROP,
      })

      // Create info window content
      const content = document.createElement('div')
      content.className = 'p-3 min-w-[200px]'
      
      const nameElement = document.createElement('h3')
      nameElement.className = 'font-bold text-lg mb-2 text-gray-900'
      nameElement.textContent = site.name
      content.appendChild(nameElement)

      if (site.heritageType) {
        const badgeElement = document.createElement('span')
        badgeElement.className = 'inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 bg-primary text-white'
        badgeElement.textContent = site.heritageType
        content.appendChild(badgeElement)
      }

      if (site.description) {
        const descElement = document.createElement('p')
        descElement.className = 'text-sm text-gray-600 mb-2'
        descElement.textContent = site.description
        content.appendChild(descElement)
      }

      if (site.address) {
        const addrElement = document.createElement('p')
        addrElement.className = 'text-xs text-gray-500'
        addrElement.textContent = site.address
        content.appendChild(addrElement)
      }

      const buttonElement = document.createElement('button')
      buttonElement.className = 'mt-2 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors'
      buttonElement.textContent = 'Add to Itinerary'
      buttonElement.onclick = () => {
        onSiteClick?.(site.id)
        infoWindowRef.current?.close()
      }
      content.appendChild(buttonElement)

      // Add click listener to marker
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(content)
          infoWindowRef.current.open(mapInstanceRef.current!, marker)
        }
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers if there are sites
    if (sites.length > 0 && mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds()
      sites.forEach(site => {
        bounds.extend(site.location)
      })
      mapInstanceRef.current.fitBounds(bounds)
      
      // Don't zoom in too much if there's only one site
      if (sites.length === 1) {
        mapInstanceRef.current.setZoom(zoom)
      }
    }
  }, [sites, onSiteClick, zoom])

  // Fallback UI if Google Maps is not available
  if (!isGoogleMapsLoaded() && !mapError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg relative overflow-hidden border-2 border-border flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg relative overflow-hidden border-2 border-border flex items-center justify-center">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">{mapError}</p>
          <p className="text-xs text-muted-foreground">
            Add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-border relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Info Overlay */}
      {sites.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg z-10">
          <p className="text-xs text-muted-foreground">
            {sites.length} heritage {sites.length === 1 ? 'site' : 'sites'} shown
          </p>
        </div>
      )}

      {/* Legend */}
      {sites.length > 0 && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg z-10">
          <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-muted-foreground">UNESCO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-muted-foreground">National</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">Regional</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView

