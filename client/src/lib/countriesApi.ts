// CountriesNow API integration for country/state/city data

export interface Country {
  name: string
  iso2: string
  iso3: string
  lat: number
  lng: number
}

export interface State {
  name: string
  state_code: string
}

export interface City {
  name: string
}

const API_BASE = 'https://countriesnow.space/api/v0.1/countries'

// Get all countries with their positions
export async function getAllCountries(): Promise<Country[]> {
  try {
    const response = await fetch(`${API_BASE}/positions`)
    const data = await response.json()
    
    if (data.error === false && data.data) {
      return data.data.map((country: any) => ({
        name: country.name,
        iso2: country.iso2,
        iso3: country.iso3,
        lat: country.lat,
        lng: country.long, // Note: API returns 'long' not 'lng'
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching countries:', error)
    return []
  }
}

// Get states of a country
export async function getStatesByCountry(countryName: string): Promise<State[]> {
  try {
    const response = await fetch(`${API_BASE}/states`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ country: countryName }),
    })
    
    const data = await response.json()
    
    if (data.error === false && data.data && data.data.states) {
      return data.data.states.map((state: any) => ({
        name: state.name,
        state_code: state.state_code || state.name,
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching states:', error)
    return []
  }
}

// Get cities of a state
export async function getCitiesByState(countryName: string, stateName: string): Promise<City[]> {
  try {
    const response = await fetch(`${API_BASE}/state/cities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: countryName,
        state: stateName,
      }),
    })
    
    const data = await response.json()
    
    if (data.error === false && data.data) {
      return data.data.map((city: string) => ({
        name: city,
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching cities:', error)
    return []
  }
}

