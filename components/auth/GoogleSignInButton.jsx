'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

export default function GoogleSignInButton({ 
  onAccountExists = null,
  className = "",
  children = null 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithGoogle, linkGoogle } = useAuth()
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    
    try {
      const result = await signInWithGoogle()

      if (result.success) {
        console.log('✅ Google login successful:', result.user.uid)
        
        if (result.isNewUser) {
          // New user - redirect to role selection
          router.push('/signup/role-selection')
          toast.success('Welcome! Please select your role to continue.')
        } else {
          // Existing user - will be handled by auth state change
          toast.success('Welcome back!')
        }
      } else {
        // Handle account exists with different credential
        if (result.code === 'account-exists') {
          if (onAccountExists) {
            onAccountExists(result.email, result.credential)
          } else {
            toast.error(
              'An account already exists with this email. Please sign in with your email/password first, then link your Google account in settings.',
              { duration: 6000 }
            )
          }
        } else {
          console.error('Google sign in failed:', result.error)
          toast.error(result.error || 'Failed to sign in with Google')
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      variant="outline"
      className={`w-full ${className}`}
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Signing in...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
            <path 
              fill="#4285F4" 
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path 
              fill="#34A853" 
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path 
              fill="#FBBC05" 
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path 
              fill="#EA4335" 
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{children || 'Continue with Google'}</span>
        </div>
      )}
    </Button>
  )
}

/**
 * Account Linking Component for when user already exists with different credential
 */
export function AccountLinkingPrompt({ email, credential, onCancel, onLink }) {
  const [isLinking, setIsLinking] = useState(false)
  const { linkGoogle } = useAuth()

  const handleLinkAccount = async () => {
    setIsLinking(true)
    
    try {
      const result = await linkGoogle(credential)
      
      if (result.success) {
        toast.success('Google account linked successfully!')
        onLink(result.user)
      } else {
        toast.error('Failed to link account: ' + result.error)
      }
    } catch (error) {
      console.error('Account linking error:', error)
      toast.error('Failed to link account. Please try again.')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Link Google Account</h3>
        <p className="text-sm text-gray-600 mt-2">
          An account already exists with <strong>{email}</strong>. 
          Would you like to link your Google account to this existing account?
        </p>
      </div>
      
      <div className="flex space-x-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isLinking}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLinkAccount}
          className="flex-1"
          disabled={isLinking}
        >
          {isLinking ? 'Linking...' : 'Link Accounts'}
        </Button>
      </div>
    </div>
  )
}