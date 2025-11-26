import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Planner from './pages/Planner'
import FogOfWar from './pages/FogOfWar'
import TravelJournal from './pages/TravelJournal'
import CommunityDiscoveries from './pages/CommunityDiscoveries'
import StoryVideo from './pages/StoryVideo'
import HeritagePassport from './pages/HeritagePassport'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/fog-of-war" element={<FogOfWar />} />
        <Route path="/journal" element={<TravelJournal />} />
        <Route path="/community" element={<CommunityDiscoveries />} />
        <Route path="/story-video" element={<StoryVideo />} />
        <Route path="/passport" element={<HeritagePassport />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

