import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ThreeDPhotoCarousel from '../components/ThreeDPhotoCarousel'
import { RetroGrid } from '../components/ui/retro-grid'

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with Carousel and RetroGrid */}
        <div className="relative min-h-[900px] md:min-h-[1000px] w-full overflow-hidden bg-background">
          <RetroGrid />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[900px] md:min-h-[1000px] py-8 md:py-12">
            {/* Title Section */}
            <div className="text-center px-4 mb-2 md:mb-6">
              <h1 className="text-5xl md:text-7xl font-bold mb-3 md:mb-4 bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-transparent dark:from-white dark:to-slate-900/10">
                Welcome to Odyssey
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-2 md:mb-3 max-w-2xl mx-auto">
                Plan your perfect journey, track your adventures, and share your
                travel stories with the world.
              </p>
            </div>
            
            {/* 3D Photo Carousel */}
            <div className="w-full px-4 mb-4 md:mb-6">
              <ThreeDPhotoCarousel />
            </div>

           
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">Plan Your Trip</h3>
              <p className="text-muted-foreground">
                Create detailed itineraries and explore destinations on an
                interactive map.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Share Stories</h3>
              <p className="text-muted-foreground">
                Document your adventures and share them with friends and family.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold mb-2">Track Visits</h3>
              <p className="text-muted-foreground">
                Build your travel passport and keep track of places you've
                visited.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Landing

