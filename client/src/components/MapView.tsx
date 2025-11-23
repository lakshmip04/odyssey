import { useEffect, useRef } from 'react'

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
}

const MapView = ({ center = { lat: 0, lng: 0 }, zoom = 2 }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Map initialization will be implemented here
    // This is a placeholder for future map integration (e.g., Google Maps, Mapbox)
    if (mapRef.current) {
      console.log('Map initialized at:', center, 'with zoom:', zoom)
    }
  }, [center, zoom])

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
    >
      <p className="text-gray-500">Map View - Integration pending</p>
    </div>
  )
}

export default MapView

