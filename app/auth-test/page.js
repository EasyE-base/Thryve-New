'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function AuthTestPage() {
  const { user, loading, signUp } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loadingSignUp, setLoadingSignUp] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoadingSignUp(true)

    try {
      const result = await signUp(formData.email, formData.password, formData.name)
      console.log('Sign up result:', result)
    } catch (error) {
      console.error('Sign up error:', error)
    } finally {
      setLoadingSignUp(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Test</h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h2 className="font-semibold text-green-800 mb-2">✅ Authenticated</h2>
              <p className="text-green-700">Email: {user.email}</p>
              <p className="text-green-700">Role: {user.role || 'Not set'}</p>
              <p className="text-green-700">Profile Complete: {user.profileComplete ? 'Yes' : 'No'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Not Authenticated</h2>
              <p className="text-yellow-700">Test the signup functionality below.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Test User"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="test@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="password123"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loadingSignUp}
              >
                {loadingSignUp ? 'Creating Account...' : 'Test Sign Up'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
} 