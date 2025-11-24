import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { MagicCard } from '../components/ui/magic-card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Mail, Phone, Lock, ArrowRight, LogIn, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RetroGrid } from '../components/ui/retro-grid'
import { isSupabaseConfigured } from '../lib/supabaseClient'

const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isEmail, setIsEmail] = useState(true)

  // Detect if input is email or phone
  const handleEmailOrPhoneChange = (value: string) => {
    setEmailOrPhone(value)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsEmail(emailRegex.test(value))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Check if it's email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const phoneRegex = /^\+?[\d\s-()]+$/
      
      let email = emailOrPhone
      
      // If it's a phone number, convert it to the format used during signup
      if (phoneRegex.test(emailOrPhone) && !emailRegex.test(emailOrPhone)) {
        // Extract digits from phone number
        const phoneDigits = emailOrPhone.replace(/\D/g, '')
        email = `${phoneDigits}@temp.odyssey.com`
      }

      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      
      // Check if it's a network/Supabase configuration error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Unable to connect to authentication service. Please check your Supabase configuration in .env file.')
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <RetroGrid className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      </div>

      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none p-0 shadow-2xl shadow-primary/5 bg-background/80 backdrop-blur-xl">
            <MagicCard
              gradientColor="#3b82f6"
              className="p-0 overflow-hidden"
            >
              <CardHeader className="border-border border-b p-8 bg-gradient-to-r from-primary/5 to-transparent relative z-20">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 relative z-20"
                >
                  <div className="p-2 rounded-lg bg-primary/10 relative z-20">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <div className="relative z-20">
                    <CardTitle className="text-3xl font-bold relative z-20 text-black dark:text-white">
                      Welcome Back
                    </CardTitle>
                    <CardDescription className="text-base mt-1 relative z-20 text-foreground">
                      Sign in to continue your journey
                    </CardDescription>
                  </div>
                </motion.div>
              </CardHeader>
              <CardContent className="p-8">
                {/* Mock Mode Indicator - Only show when Supabase is not configured */}
                {!isSupabaseConfigured && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                        <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xs space-y-1 flex-1">
                        <p className="font-semibold text-blue-800 dark:text-blue-200">🧪 Mock Authentication Mode</p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Using local storage for authentication. Create an account via Signup to test the login flow.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Test Credentials Helper - Only in Development with Supabase */}
                {import.meta.env.DEV && isSupabaseConfigured && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg"
                  >
                    <p className="text-xs font-semibold text-primary mb-2">🧪 Test Credentials (Dev Only)</p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><strong>Email:</strong> test@odyssey.com</p>
                      <p><strong>Password:</strong> test123456</p>
                      <p className="text-[10px] mt-2 opacity-75">Create account via Signup page first</p>
                    </div>
                  </motion.div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid gap-3"
                  >
                    <Label htmlFor="emailOrPhone" className="flex items-center gap-2 text-sm font-semibold">
                      {isEmail ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      Email or Phone Number
                    </Label>
                    <Input
                      id="emailOrPhone"
                      type="text"
                      placeholder="name@example.com or +1234567890"
                      value={emailOrPhone}
                      onChange={(e) => handleEmailOrPhoneChange(e.target.value)}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid gap-3"
                  >
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </motion.div>
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg backdrop-blur-sm"
                      >
                        <p className="text-sm text-destructive font-medium">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                      size="lg"
                    >
                      {isLoading ? (
                        'Signing in...'
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
              <CardFooter className="border-border border-t p-6 flex-col space-y-2 bg-gradient-to-r from-transparent to-primary/5">
                <p className="text-sm text-muted-foreground text-center">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:underline font-semibold transition-colors">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </MagicCard>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default Login
