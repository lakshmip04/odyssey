// GeoJSON data sources and utilities for Fog of War map

const WORLD_COUNTRIES_GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// Cache for loaded GeoJSON
let worldGeoJSONCache: any = null

// Get world countries GeoJSON
export async function getWorldCountriesGeoJSON(): Promise<any> {
  if (worldGeoJSONCache) {
    return worldGeoJSONCache
  }

  try {
    const response = await fetch(WORLD_COUNTRIES_GEOJSON_URL)
    const data = await response.json()
    worldGeoJSONCache = data
    return data
  } catch (error) {
    console.error('Error loading world countries GeoJSON:', error)
    return null
  }
}

// Get country GeoJSON from world GeoJSON
export function getCountryGeoJSON(worldGeoJSON: any, countryCode: string): any | null {
  if (!worldGeoJSON || !worldGeoJSON.features) return null

  const feature = worldGeoJSON.features.find((ft: any) => {
    const isoA2 = ft.properties.ISO_A2 || ft.properties.ISO2 || ft.properties.ADM0_A2
    const isoA3 = ft.properties.ISO_A3 || ft.properties.ISO3 || ft.properties.ADM0_A3
    return isoA2 === countryCode || isoA3 === countryCode
  })

  if (feature) {
    return {
      type: 'FeatureCollection',
      features: [feature]
    }
  }

  return null
}

// Note: getCountryCodeFromName is now in locationData.ts

// Get bounds from GeoJSON feature
export function getBoundsFromFeature(feature: any): google.maps.LatLngBounds | null {
  if (!feature || !feature.geometry) return null

  const bounds = new google.maps.LatLngBounds()
  
  const processCoordinates = (coords: any) => {
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      // MultiPolygon or Polygon
      coords.forEach((ring: any) => {
        if (Array.isArray(ring[0]) && typeof ring[0][0] === 'number') {
          ring.forEach((coord: any) => {
            bounds.extend(new google.maps.LatLng(coord[1], coord[0]))
          })
        } else {
          processCoordinates(ring)
        }
      })
    } else if (typeof coords[0] === 'number') {
      // Point
      bounds.extend(new google.maps.LatLng(coords[1], coords[0]))
    }
  }

  if (feature.geometry.type === 'Polygon') {
    feature.geometry.coordinates.forEach((ring: any) => {
      ring.forEach((coord: any) => {
        bounds.extend(new google.maps.LatLng(coord[1], coord[0]))
      })
    })
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach((polygon: any) => {
      polygon.forEach((ring: any) => {
        ring.forEach((coord: any) => {
          bounds.extend(new google.maps.LatLng(coord[1], coord[0]))
        })
      })
    })
  }

  return bounds
}

