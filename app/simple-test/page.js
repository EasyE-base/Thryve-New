'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

export default function SimpleTestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const { user, signOut } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      console.log('🔥 Testing Firebase auth with:', formData.email)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user
      console.log('🔥 Firebase user created:', user.uid)
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: formData.name,
        createdAt: new Date(),
        role: null,
        profileComplete: false
      })
      console.log('🔥 Firestore document created')
      
      setResult({
        success: true,
        message: 'User created successfully!',
        user: {
          uid: user.uid,
          email: user.email,
          displayName: formData.name
        }
      })
    } catch (error) {
      console.error('🔥 Firebase auth error:', error)
      setResult({
        success: false,
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setResult({
        success: true,
        message: 'Signed out successfully!'
      })
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Firebase Auth Test</h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">✅ Signed In</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
            </div>
            <Button onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </div>
        ) : (
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
                required
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
                required
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
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Test Firebase Auth'}
            </Button>
          </form>
        )}
        
        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <h3 className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <p className="text-sm">{result.message}</p>
            {result.success && result.user && (
              <div className="mt-2 text-sm">
                <p><strong>UID:</strong> {result.user.uid}</p>
                <p><strong>Email:</strong> {result.user.email}</p>
                <p><strong>Name:</strong> {result.user.displayName}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Go back to home
          </a>
        </div>
      </div>
    </div>
  )
} 