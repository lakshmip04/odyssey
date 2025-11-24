import { useState } from 'react'
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
import { Stepper } from '../components/ui/stepper'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { CheckCircle2, User, Globe, Calendar, Mail, Phone, Lock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RetroGrid } from '../components/ui/retro-grid'

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
  'Germany', 'France', 'Italy', 'Spain', 'Japan', 'China', 'Brazil',
  'Mexico', 'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
  'Finland', 'Switzerland', 'Austria', 'Belgium', 'Poland', 'Portugal',
  'Greece', 'Ireland', 'New Zealand', 'Singapore', 'Thailand', 'Other'
]

const Signup = () => {
  const navigate = useNavigate()
  const { signUp } = useSupabaseAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Personal Information
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [dob, setDob] = useState('')

  // Step 2: Contact Information
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [isEmail, setIsEmail] = useState(true)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

  // Step 3: Password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const steps = ['Personal Info', 'Contact & OTP', 'Password', 'Complete']

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Name is required')
      return false
    }
    if (!country) {
      setError('Country is required')
      return false
    }
    if (!dob) {
      setError('Date of birth is required')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!emailOrPhone.trim()) {
      setError('Email or phone number is required')
      return false
    }
    
    // Check if it's email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[\d\s-()]+$/
    
    if (emailRegex.test(emailOrPhone)) {
      setIsEmail(true)
    } else if (phoneRegex.test(emailOrPhone)) {
      setIsEmail(false)
    } else {
      setError('Please enter a valid email or phone number')
      return false
    }

    if (!otpSent) {
      // In a real app, you would send OTP here
      // For now, we'll simulate it
      setOtpSent(true)
      setError(null)
      // Simulate OTP (in production, this would come from your backend)
      console.log('OTP sent to:', emailOrPhone)
      return false
    }

    if (!otpVerified) {
      if (!otp.trim()) {
        setError('Please enter the OTP')
        return false
      }
      // In a real app, you would verify OTP here
      // For demo purposes, accept any 6-digit OTP
      if (otp.length === 6 && /^\d+$/.test(otp)) {
        setOtpVerified(true)
        setError(null)
        return true
      } else {
        setError('Please enter a valid 6-digit OTP')
        return false
      }
    }

    return true
  }

  const validateStep3 = () => {
    if (!password) {
      setError('Password is required')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleNext = async () => {
    setError(null)

    if (currentStep === 0) {
      if (validateStep1()) {
        setCurrentStep(1)
      }
    } else if (currentStep === 1) {
      if (validateStep2()) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (validateStep3()) {
        setCurrentStep(3)
        // Submit the form
        await handleSubmit()
      }
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Use email for Supabase signup (if phone, you'd need to handle it differently)
      const email = isEmail ? emailOrPhone : `${emailOrPhone.replace(/\D/g, '')}@temp.odyssey.com`
      await signUp(email, password, {
        name,
        country,
        dob,
      })
      // Don't navigate immediately, show success step first
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCurrentStep(2) // Go back to password step on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleResendOtp = () => {
    setOtpSent(false)
    setOtpVerified(false)
    setOtp('')
    // In a real app, resend OTP
    console.log('OTP resent to:', emailOrPhone)
    setOtpSent(true)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="grid gap-3">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="country" className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="w-4 h-4" />
                Country
              </Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 hover:border-primary/50"
                required
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="dob" className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {!otpSent ? (
              <>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Welcome, {name}! 👋
                    </p>
                  </div>
                </motion.div>
                <div className="grid gap-3">
                  <Label htmlFor="emailOrPhone" className="flex items-center gap-2 text-sm font-semibold">
                    {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    Email or Phone Number
                  </Label>
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="name@example.com or +1234567890"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Welcome, {name}! 👋
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-7">
                    OTP sent to {emailOrPhone}
                  </p>
                </motion.div>
                <div className="grid gap-3">
                  <Label htmlFor="otp" className="flex items-center gap-2 text-sm font-semibold">
                    <Lock className="w-4 h-4" />
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="text-center text-2xl tracking-widest h-14 font-mono transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-primary hover:underline font-medium transition-colors"
                    >
                      Resend OTP
                    </button>
                    <span className="text-muted-foreground font-mono">
                      {otp.length}/6
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="grid gap-3">
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
                minLength={6}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
                minLength={6}
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive flex items-center gap-2"
              >
                Passwords do not match
              </motion.p>
            )}
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="space-y-4 text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-4" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              Account Created!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6"
            >
              Welcome to Odyssey, <span className="font-semibold text-foreground">{name}</span>! Your account has been successfully created.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )

      default:
        return null
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
          className="w-full max-w-lg"
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
                  className="relative z-20"
                >
                  <CardTitle className="text-3xl font-bold relative z-20 text-black dark:text-white">
                    Create Your Account
                  </CardTitle>
                  <CardDescription className="text-base mt-2 relative z-20 text-foreground">
                    Join Odyssey and start planning your next adventure
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-8">
                  <Stepper steps={steps} currentStep={currentStep} />
                </div>
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg backdrop-blur-sm"
                    >
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </CardContent>
              {currentStep < 3 && (
                <>
                  <CardFooter className="border-border border-t p-6 flex justify-between gap-4 bg-gradient-to-r from-transparent to-primary/5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0 || isLoading}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                    >
                      {isLoading
                        ? 'Loading...'
                        : currentStep === 1 && !otpVerified
                        ? 'Send OTP'
                        : currentStep === 2
                        ? 'Create Account'
                        : 'Next'}
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </CardFooter>
                  <CardFooter className="border-border border-t p-6 flex-col space-y-2 bg-gradient-to-r from-transparent to-primary/5">
                    <p className="text-sm text-muted-foreground text-center">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary hover:underline font-semibold transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </CardFooter>
                </>
              )}
            </MagicCard>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default Signup
