import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthForm from '../components/AuthForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { MagicCard } from '../components/ui/magic-card'

const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-none p-0 shadow-none">
          <MagicCard
            gradientColor="#D9D9D955"
            className="p-0"
          >
            <CardHeader className="border-border border-b p-6">
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AuthForm mode="login" onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
            <CardFooter className="border-border border-t p-6 flex-col space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </MagicCard>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

export default Login

