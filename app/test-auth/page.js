'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const { user, loading, signOut } = useAuth()

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
            <Button onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Not Authenticated</h2>
              <p className="text-yellow-700">Please sign in to test the authentication system.</p>
            </div>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 