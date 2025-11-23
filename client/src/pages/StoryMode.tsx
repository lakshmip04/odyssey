import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PassportBadge from '../components/PassportBadge'

const StoryMode = () => {
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSupabaseAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Sample data - will be replaced with actual data from backend
  const sampleCountries = [
    { name: 'France', visited: true },
    { name: 'Japan', visited: true },
    { name: 'Brazil', visited: false },
    { name: 'Australia', visited: false },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Story Mode</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Travel Stories</h2>
              <p className="text-gray-600 mb-4">
                Share your travel experiences and memories here.
              </p>
              <div className="space-y-4">
                <p className="text-gray-500 italic">No stories yet. Start documenting your adventures!</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Travel Passport</h2>
              <div className="space-y-3">
                {sampleCountries.map((country) => (
                  <PassportBadge
                    key={country.name}
                    country={country.name}
                    visited={country.visited}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default StoryMode

