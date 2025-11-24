// Mock authentication system for frontend development without Supabase

interface MockUser {
  id: string
  email: string
  name?: string
  country?: string
  dob?: string
  createdAt: string
}

const STORAGE_KEY = 'odyssey_mock_users'
const SESSION_KEY = 'odyssey_mock_session'

// Get all mock users from localStorage
const getMockUsers = (): MockUser[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save mock users to localStorage
const saveMockUsers = (users: MockUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving mock users:', error)
  }
}

// Get current session from localStorage
export const getMockSession = (): MockUser | null => {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Set current session in sessionStorage
const setMockSession = (user: MockUser | null): void => {
  try {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch (error) {
    console.error('Error setting mock session:', error)
  }
}

// Mock sign up
export const mockSignUp = async (email: string, password: string, userData?: {
  name?: string
  country?: string
  dob?: string
}): Promise<MockUser> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const users = getMockUsers()
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    throw new Error('User already exists with this email')
  }

  // Create new user
  const newUser: MockUser = {
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    name: userData?.name,
    country: userData?.country,
    dob: userData?.dob,
    createdAt: new Date().toISOString(),
  }

  // Save user (in real app, password would be hashed)
  users.push(newUser)
  saveMockUsers(users)

  // Set session
  setMockSession(newUser)

  return newUser
}

// Mock sign in
export const mockSignIn = async (email: string, password: string): Promise<MockUser> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const users = getMockUsers()
  
  // Find user by email
  const user = users.find(u => u.email === email)
  if (!user) {
    throw new Error('Invalid login credentials')
  }

  // In a real app, we would verify the password here
  // For mock, we accept any password for existing users

  // Set session
  setMockSession(user)

  return user
}

// Mock sign out
export const mockSignOut = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  setMockSession(null)
}

// Mock get session
export const mockGetSession = async (): Promise<MockUser | null> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getMockSession()
}


