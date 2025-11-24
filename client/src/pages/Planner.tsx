import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { HeritageSite, searchHeritageSites } from '../lib/placesApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LocationSearch from '../components/LocationSearch'
import HeritageSiteCard from '../components/HeritageSiteCard'
import ItineraryItem from '../components/ItineraryItem'
import MapView from '../components/MapView'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { 
  Map, 
  List, 
  Sparkles, 
  Loader2, 
  Calendar,
  Download,
  Share2,
  Trash2
} from 'lucide-react'
import { RetroGrid } from '../components/ui/retro-grid'

const Planner = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()
  const [selectedLocation, setSelectedLocation] = useState('')
  const [heritageSites, setHeritageSites] = useState<HeritageSite[]>([])
  const [itinerary, setItinerary] = useState<HeritageSite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const handleLocationSearch = async (location: string) => {
    setSelectedLocation(location)
    setIsLoading(true)
    try {
      const sites = await searchHeritageSites(location)
      setHeritageSites(sites)
      
      // Set map center to first site if available
      if (sites.length > 0) {
        setMapCenter(sites[0].location)
      }
    } catch (error) {
      console.error('Error fetching heritage sites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToItinerary = (site: HeritageSite) => {
    if (!itinerary.find(s => s.id === site.id)) {
      setItinerary([...itinerary, site])
    }
  }

  const handleRemoveFromItinerary = (id: string) => {
    setItinerary(itinerary.filter(site => site.id !== id))
  }

  const handleClearItinerary = () => {
    setItinerary([])
  }

  const isSiteInItinerary = (siteId: string) => {
    return itinerary.some(site => site.id === siteId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <RetroGrid className="opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      </div>

      <Navbar />
      
      <main className="flex-grow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Smart Itinerary Planner
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover heritage sites and plan your perfect journey
                </p>
              </div>
            </div>
          </motion.div>

          {/* Location Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <LocationSearch onLocationSelect={handleLocationSearch} />
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heritage Sites Section */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      Heritage Sites
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation 
                        ? `Discovering heritage sites in ${selectedLocation}...`
                        : 'Search for a location to discover heritage sites'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Map
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : viewMode === 'map' ? (
                  <div className="h-[600px] rounded-lg overflow-hidden">
                    <MapView 
                      center={mapCenter || { lat: 25.3176, lng: 83.0104 }}
                      zoom={12}
                      sites={heritageSites}
                      onSiteClick={(siteId) => {
                        const site = heritageSites.find(s => s.id === siteId)
                        if (site) {
                          handleAddToItinerary(site)
                        }
                      }}
                    />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {heritageSites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {heritageSites.map((site, index) => (
                          <HeritageSiteCard
                            key={site.id}
                            site={site}
                            index={index}
                            onAddToItinerary={handleAddToItinerary}
                            isInItinerary={isSiteInItinerary(site.id)}
                          />
                        ))}
                      </div>
                    ) : selectedLocation ? (
                      <div className="text-center py-20">
                        <Map className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No heritage sites found for this location
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <Sparkles className="w-16 h-16 mx-auto text-primary/40 mb-4" />
                        <p className="text-muted-foreground">
                          Search for a location to discover amazing heritage sites
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                )}
              </Card>
            </div>

            {/* Itinerary Section */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-2 sticky top-8 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-primary" />
                      Your Itinerary
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {itinerary.length} {itinerary.length === 1 ? 'site' : 'sites'} added
                    </p>
                  </div>
                  
                  {itinerary.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearItinerary}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {itinerary.length > 0 ? (
                      itinerary.map((site, index) => (
                        <ItineraryItem
                          key={site.id}
                          site={site}
                          index={index}
                          onRemove={handleRemoveFromItinerary}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <Calendar className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground mb-2">
                          Your itinerary is empty
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Add heritage sites to start planning
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {itinerary.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border space-y-2">
                    <Button className="w-full" size="lg">
                      <Download className="w-4 h-4 mr-2" />
                      Export Itinerary
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Planner
