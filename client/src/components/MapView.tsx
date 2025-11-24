import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  sites?: Array<{
    id: string
    name: string
    location: { lat: number; lng: number }
    heritageType?: string
  }>
  onSiteClick?: (siteId: string) => void
}

const MapView = ({ 
  center = { lat: 0, lng: 0 }, 
  zoom = 2,
  sites = [],
  onSiteClick
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [hoveredSite, setHoveredSite] = useState<string | null>(null)

  useEffect(() => {
    // Map initialization will be implemented here
    // This is a placeholder for future map integration (e.g., Google Maps, Mapbox)
    if (mapRef.current) {
      console.log('Map initialized at:', center, 'with zoom:', zoom)
    }
  }, [center, zoom])

  const getMarkerColor = (heritageType?: string) => {
    switch (heritageType) {
      case 'UNESCO':
        return 'bg-amber-500 border-amber-600'
      case 'National':
        return 'bg-blue-500 border-blue-600'
      case 'Regional':
        return 'bg-green-500 border-green-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  // For now, show a styled placeholder with markers
  // In production, integrate with Mapbox GL JS or Google Maps
  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg relative overflow-hidden border-2 border-border"
    >
      {/* Placeholder Map Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.3) 0%, transparent 50%)`
        }} />
      </div>

      {/* Map Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Center Marker */}
      {center.lat !== 0 && center.lng !== 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full"
          />
        </div>
      )}

      {/* Site Markers */}
      {sites.map((site, index) => {
        // Calculate relative position (simplified - in production use proper projection)
        const x = 50 + (site.location.lng - center.lng) * 10
        const y = 50 - (site.location.lat - center.lat) * 10

        return (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute z-20 cursor-pointer group"
            style={{
              left: `${Math.max(5, Math.min(95, x))}%`,
              top: `${Math.max(5, Math.min(95, y))}%`,
            }}
            onMouseEnter={() => setHoveredSite(site.id)}
            onMouseLeave={() => setHoveredSite(null)}
            onClick={() => onSiteClick?.(site.id)}
          >
            <div className={`relative ${getMarkerColor(site.heritageType)} rounded-full p-2 border-2 shadow-lg transition-all group-hover:scale-125`}>
              <MapPin className="w-5 h-5 text-white" />
              
              {/* Tooltip */}
              {hoveredSite === site.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                >
                  {site.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Map Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
        <p className="text-xs text-muted-foreground">
          {sites.length > 0 
            ? `${sites.length} heritage ${sites.length === 1 ? 'site' : 'sites'} shown`
            : 'Map view - Click markers to explore'
          }
        </p>
      </div>

      {/* Integration Notice */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-lg">
        <p className="text-xs text-muted-foreground">
          Map integration: Mapbox/Google Maps
        </p>
      </div>
    </div>
  )
}

export default MapView

