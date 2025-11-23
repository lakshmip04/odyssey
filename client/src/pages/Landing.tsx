import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Meteors } from '../components/ui/meteors'
import { Button } from '../components/ui/button'

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with Meteors */}
        <div className="relative h-[600px] w-full overflow-hidden flex items-center justify-center">
          <Meteors number={30} />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-transparent dark:from-white dark:to-slate-900/10">
              Welcome to Odyssey
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Plan your perfect journey, track your adventures, and share your
              travel stories with the world.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
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

