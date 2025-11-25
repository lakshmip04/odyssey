import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { getVisitedLocations } from '../lib/travelJournalApi'
import { getAllCountries, getStatesByCountry, getCitiesByState, type Country, type State, type City } from '../lib/countriesApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FogOfWarMap from '../components/FogOfWarMap'
import SearchableSelect from '../components/SearchableSelect'
import { Lock, Globe, MapPin, Navigation, Map as MapIcon, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { RetroGrid } from '../components/ui/retro-grid'
import { Input } from '../components/ui/input'

const FogOfWar = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [visitedLocations, setVisitedLocations] = useState<Array<{
    lat: number
    lng: number
    name: string
    visitedAt: string
    country?: string
    state?: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapView, setMapView] = useState<'world' | 'country' | 'state'>('world')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState<string>('')
  
  // CountriesNow API data
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [filteredCities, setFilteredCities] = useState<City[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      loadVisitedLocations()
      loadCountries()
    }
  }, [isAuthenticated])

  const loadCountries = async () => {
    setIsLoadingCountries(true)
    try {
      const countriesData = await getAllCountries()
      setCountries(countriesData)
    } catch (error) {
      console.error('Error loading countries:', error)
    } finally {
      setIsLoadingCountries(false)
    }
  }

  const handleCountryChange = async (countryName: string) => {
    setSelectedCountry(countryName)
    setSelectedState(null)
    setCitySearch('')
    setStates([])
    setCities([])
    setFilteredCities([])
    
    if (countryName) {
      // Automatically switch to country view when country is selected
      setMapView('country')
      
      try {
        const statesData = await getStatesByCountry(countryName)
        setStates(statesData)
      } catch (error) {
        console.error('Error loading states:', error)
      }
    } else {
      // If "All Countries" selected, switch back to world view
      setMapView('world')
    }
  }

  const handleStateChange = async (stateName: string) => {
    setSelectedState(stateName)
    setCitySearch('')
    setCities([])
    setFilteredCities([])
    
    if (stateName && selectedCountry) {
      // Automatically switch to state view when state is selected
      setMapView('state')
      
      try {
        const citiesData = await getCitiesByState(selectedCountry, stateName)
        setCities(citiesData)
        setFilteredCities(citiesData)
      } catch (error) {
        console.error('Error loading cities:', error)
      }
    } else {
      // If "All States" selected, switch back to country view
      if (selectedCountry) {
        setMapView('country')
      }
    }
  }

  const handleCitySearch = (query: string) => {
    setCitySearch(query)
    if (query.trim()) {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredCities(filtered)
    } else {
      setFilteredCities(cities)
    }
  }

  const loadVisitedLocations = async () => {
    setIsLoading(true)
    try {
      const locations = await getVisitedLocations()
      setVisitedLocations(locations)
    } catch (error) {
      console.error('Error loading visited locations:', error)
      setVisitedLocations([])
    } finally {
      setIsLoading(false)
    }
  }

  // Request geolocation to track current position
  const requestLocationAccess = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Current location:', position.coords.latitude, position.coords.longitude)
          // In production, this would save to travel journal
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4D4D8]">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#D4D4D8]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <RetroGrid className="opacity-10" />
      </div>

      <Navbar />
      
      <main className="flex-grow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FDE047]/20">
                  <Lock className="w-6 h-6 text-yellow-800" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Fog of War Map</h1>
                  <p className="text-gray-600 text-sm">Discover the world as you travel</p>
                </div>
              </div>
              <Button
                onClick={requestLocationAccess}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Track Location
              </Button>
            </div>
          </motion.div>

          {/* Map View Selector and Location Filters */}
          <Card className="p-4 bg-background/80 backdrop-blur-xl border-2 mb-4">
            <div className="space-y-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-700 mr-2">View:</span>
                <Button
                  variant={mapView === 'world' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMapView('world')
                    setSelectedCountry(null)
                    setSelectedState(null)
                    setCitySearch('')
                  }}
                  className={mapView === 'world' ? 'bg-[#FDE047] text-yellow-900 hover:bg-[#FACC15]' : ''}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  World Map
                </Button>
              <Button
                variant={mapView === 'country' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMapView('country')
                  if (!selectedCountry) {
                    // If no country selected, don't switch view yet
                    // User needs to select a country first
                  }
                  setSelectedState(null)
                  setCitySearch('')
                }}
                className={mapView === 'country' ? 'bg-[#FDE047] text-yellow-900 hover:bg-[#FACC15]' : ''}
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Country Map
              </Button>
              <Button
                variant={mapView === 'state' ? 'default' : 'outline'}
                size="sm"
                  onClick={() => {
                    if (!selectedCountry) {
                      alert('Please select a country first')
                      return
                    }
                    setMapView('state')
                    setCitySearch('')
                  }}
                disabled={!selectedCountry}
                className={mapView === 'state' ? 'bg-[#FDE047] text-yellow-900 hover:bg-[#FACC15]' : ''}
              >
                <MapPin className="w-4 h-4 mr-2" />
                State Map
              </Button>
              </div>

              {/* Location Selectors using CountriesNow API */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <SearchableSelect
                    value={selectedCountry || ''}
                    onChange={handleCountryChange}
                    options={[
                      { value: '', label: 'All Countries (World View)' },
                      ...countries.map(country => ({ value: country.name, label: country.name }))
                    ]}
                    placeholder={isLoadingCountries ? "Loading countries..." : "Choose a country..."}
                    disabled={isLoadingCountries}
                    label={`Select Country ${mapView === 'country' || mapView === 'state' ? '(Required)' : ''}`}
                  />
                </div>

                <div>
                  <SearchableSelect
                    value={selectedState || ''}
                    onChange={handleStateChange}
                    options={[
                      { value: '', label: 'All States' },
                      ...states.map(state => ({ value: state.name, label: state.name }))
                    ]}
                    placeholder={
                      !selectedCountry 
                        ? "Select country first" 
                        : states.length === 0 
                        ? "Loading states..." 
                        : "All States"
                    }
                    disabled={!selectedCountry || states.length === 0}
                    label={`Select State ${mapView === 'state' ? '(Required)' : '(Optional)'}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Search City (Optional)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={citySearch}
                      onChange={(e) => handleCitySearch(e.target.value)}
                      placeholder={
                        !selectedState 
                          ? "Select state first" 
                          : cities.length === 0 
                          ? "Loading cities..." 
                          : "Search cities..."
                      }
                      disabled={!selectedState || cities.length === 0}
                      className="pl-9"
                    />
                  </div>
                  {citySearch && filteredCities.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Main Map */}
          <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 mb-6">
            <div className="h-[600px] rounded-lg overflow-hidden">
              <FogOfWarMap 
                visitedLocations={visitedLocations}
                viewMode={mapView}
                selectedCountry={selectedCountry}
                selectedState={selectedState}
              />
            </div>
          </Card>

          {/* Stats and Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-[#FDE047]/10 border-2 border-[#FDE047]/30">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-yellow-800" />
                <div>
                  <p className="text-sm text-gray-600">Regions Discovered</p>
                  <p className="text-2xl font-bold text-gray-900">{visitedLocations.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#8B5CF6]/10 border-2 border-[#8B5CF6]/30">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-800" />
                <div>
                  <p className="text-sm text-gray-600">Locations Visited</p>
                  <p className="text-2xl font-bold text-gray-900">{visitedLocations.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#BEF265]/10 border-2 border-[#BEF265]/30">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-green-800" />
                <div>
                  <p className="text-sm text-gray-600">Coverage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {visitedLocations.length > 0 ? `${Math.min(100, visitedLocations.length * 5)}%` : '0%'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 mt-6">
            <h3 className="text-lg font-semibold mb-3">How it works</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• The map starts covered in fog (greyed out)</p>
              <p>• As you visit places, the fog clears and regions light up</p>
              <p>• Enable location tracking to automatically log your visits</p>
              <p>• Each discovered region is marked with a yellow pin</p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default FogOfWar

