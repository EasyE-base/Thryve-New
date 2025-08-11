'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [selectedRole, setSelectedRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Please fill in all fields')
        setLoading(false)
        return
      }

      if (!selectedRole) {
        toast.error('Please select a role to continue')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // Sign up with Firebase
      console.log('🔥 Creating Firebase user:', formData.email)
      const result = await signUp(formData.email, formData.password, formData.name, selectedRole)
      
      if (result.success) {
        console.log('🔥 Firebase user created successfully:', result.user)
        toast.success('Account created successfully!')

        // Directly route to the correct onboarding based on selected role
        const roleMap = { studio: 'merchant', merchant: 'merchant', instructor: 'instructor', customer: 'customer' }
        const mapped = roleMap[selectedRole] || selectedRole
        const onboardingPaths = {
          customer: '/onboarding/customer',
          instructor: '/onboarding/instructor',
          merchant: '/onboarding/merchant'
        }
        const target = onboardingPaths[mapped] || '/dashboard'
        router.push(target)
      } else {
        throw new Error(result.error || 'Failed to create account')
      }

    } catch (error) {
      console.error('❌ Sign up error:', error)
      toast.error(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join Thryve and transform your fitness journey</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select your role</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'studio', label: 'Studio Owner' },
                    { id: 'instructor', label: 'Instructor' },
                    { id: 'customer', label: 'Enthusiast' }
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        selectedRole === r.id ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {!selectedRole && (
                  <p className="text-xs text-gray-500 mt-1">You must choose a role to continue</p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <GoogleSignInButton className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Continue with Google
                </GoogleSignInButton>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}