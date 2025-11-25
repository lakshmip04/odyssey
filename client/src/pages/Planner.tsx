import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { HeritageSite, searchHeritageSites } from '../lib/placesApi'
import { 
  createItinerary, 
  getUserItineraries, 
  deleteItinerary,
  getItinerary,
  smartPlanItinerary,
  markItineraryCompleted,
  type Itinerary 
} from '../lib/itineraryApi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LocationSearch from '../components/LocationSearch'
import HeritageSiteCard from '../components/HeritageSiteCard'
import ItineraryItem from '../components/ItineraryItem'
import MapView from '../components/MapView'
import SaveTripDialog from '../components/SaveTripDialog'
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
  Trash2,
  Save,
  X,
  Wand2,
  CheckCircle2
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
  
  // Saved itineraries
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null) // null = new itinerary, otherwise itinerary ID
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  // Load saved itineraries
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedItineraries()
    }
  }, [isAuthenticated])

  const loadSavedItineraries = async () => {
    try {
      const itineraries = await getUserItineraries()
      setSavedItineraries(itineraries)
    } catch (error) {
      console.error('Error loading itineraries:', error)
    }
  }

  const handleLocationSearch = async (location: string, placeDetails?: any) => {
    setSelectedLocation(location)
    setIsLoading(true)
    
    try {
      let locationCoords: { lat: number; lng: number } | undefined
      
      if (placeDetails?.geometry?.location) {
        const lat = typeof placeDetails.geometry.location.lat === 'function' 
          ? placeDetails.geometry.location.lat() 
          : placeDetails.geometry.location.lat
        const lng = typeof placeDetails.geometry.location.lng === 'function'
          ? placeDetails.geometry.location.lng()
          : placeDetails.geometry.location.lng
        
        locationCoords = { lat, lng }
        setMapCenter(locationCoords)
      }
      
      const sites = await searchHeritageSites(location, locationCoords)
      setHeritageSites(sites)
      
      if (sites.length > 0 && !locationCoords) {
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
    setActiveTab(null)
  }

  const handleSmartPlan = () => {
    if (itinerary.length > 1) {
      const optimized = smartPlanItinerary(itinerary)
      setItinerary(optimized)
    }
  }

  const handleSaveTrip = async (data: {
    name: string
    location: string
    start_date?: string
    end_date?: string
    description?: string
    is_smart_planned: boolean
  }) => {
    setIsSaving(true)
    try {
      let sitesToSave = itinerary
      
      // Apply smart planning if requested
      if (data.is_smart_planned && itinerary.length > 1) {
        sitesToSave = smartPlanItinerary(itinerary)
      }

      await createItinerary({
        ...data,
        items: sitesToSave,
      })

      await loadSavedItineraries()
      setItinerary([])
      setActiveTab(null)
    } catch (error) {
      console.error('Error saving trip:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadItinerary = async (itineraryId: string) => {
    try {
      const loaded = await getItinerary(itineraryId)
      setActiveTab(itineraryId)
      setSelectedLocation(loaded.location)
      
      // Convert itinerary items back to HeritageSite format
      const sites: HeritageSite[] = (loaded.items || []).map(item => ({
        id: item.site_id,
        name: item.site_name,
        description: item.site_description || undefined,
        location: {
          lat: item.location_lat,
          lng: item.location_lng,
        },
        address: item.site_address || undefined,
        rating: item.site_rating || undefined,
        category: item.site_category || undefined,
        heritageType: item.site_heritage_type as any,
      }))
      
      setItinerary(sites)
      
      // Set map center
      if (sites.length > 0) {
        setMapCenter(sites[0].location)
      }
    } catch (error) {
      console.error('Error loading itinerary:', error)
    }
  }

  const handleMarkCompleted = async () => {
    if (!activeTab) return
    
    if (!confirm('Mark this trip as completed? All sites will be added to your travel journal and marked on the Fog of War map.')) {
      return
    }

    try {
      await markItineraryCompleted(activeTab)
      await loadSavedItineraries()
      alert('Trip marked as completed! Sites have been added to your travel journal.')
    } catch (error) {
      console.error('Error marking trip as completed:', error)
      alert('Failed to mark trip as completed. Please try again.')
    }
  }

  const handleDeleteItinerary = async (itineraryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await deleteItinerary(itineraryId)
        await loadSavedItineraries()
        if (activeTab === itineraryId) {
          setActiveTab(null)
          setItinerary([])
        }
      } catch (error) {
        console.error('Error deleting itinerary:', error)
      }
    }
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
            <div className="flex items-center justify-between">
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
            </div>
          </motion.div>

          {/* Saved Itineraries Tabs */}
          {savedItineraries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="p-4 bg-background/80 backdrop-blur-xl border-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Saved Trips</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab(null)
                      setItinerary([])
                      setSelectedLocation('')
                    }}
                  >
                    New Itinerary
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveTab(null)
                      setItinerary([])
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === null
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    New Trip
                  </button>
                  {savedItineraries.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={() => handleLoadItinerary(it.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          activeTab === it.id
                            ? 'bg-primary text-white'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {it.name}
                        {it.is_smart_planned && (
                          <Wand2 className="w-3 h-3" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteItinerary(it.id, e)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

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
                  <div className="h-[600px] rounded-lg overflow-hidden relative">
                    <MapView 
                      key={`map-${selectedLocation}-${heritageSites.length}`}
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
                    {itinerary.length > 1 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={handleSmartPlan}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Smart Plan Route
                      </Button>
                    )}
                    {activeTab ? (
                      <>
                        {savedItineraries.find(it => it.id === activeTab)?.is_completed ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            disabled
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Trip Completed
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-[#FDE047] hover:bg-[#FACC15] text-yellow-900"
                            size="lg"
                            onClick={handleMarkCompleted}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Trip as Completed
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setIsSaveDialogOpen(true)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Trip
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" size="lg">
                      <Download className="w-4 h-4 mr-2" />
                      Export
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

      <SaveTripDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveTrip}
        location={selectedLocation || 'Unknown Location'}
        items={itinerary}
        isLoading={isSaving}
      />

      <Footer />
    </div>
  )
}

export default Planner
