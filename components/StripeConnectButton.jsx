'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'

export default function StripeConnectButton({ instructor, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleConnect = async () => {
    if (!user) {
      toast.error('Please sign in to continue')
      return
    }
    
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/stripe/connect/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create Stripe Connect account')
      }
      
      const data = await response.json()
      
      if (data.url) {
        toast.success('Redirecting to Stripe Connect...')
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url
      } else {
        throw new Error('No redirect URL received')
      }
    } catch (error) {
      console.error('Error connecting Stripe account:', error)
      toast.error(error.message || 'Failed to connect Stripe account')
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return 'Connecting...'
    
    switch (instructor?.stripeAccountStatus) {
      case 'pending':
        return 'Complete Stripe Setup'
      case 'onboarding':
        return 'Continue Stripe Setup'
      case 'active':
        return 'Manage Stripe Account'
      default:
        return 'Connect Stripe Account'
    }
  }

  const getButtonVariant = () => {
    return instructor?.stripeAccountStatus === 'active' ? 'outline' : 'default'
  }

  const getStatusBadge = () => {
    if (!instructor?.stripeAccountStatus) return null

    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30', text: 'Setup Required' },
      onboarding: { color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', text: 'In Progress' },
      active: { color: 'bg-green-500/20 text-green-300 border-green-400/30', text: 'Active' },
      rejected: { color: 'bg-red-500/20 text-red-300 border-red-400/30', text: 'Rejected' }
    }

    const config = statusConfig[instructor.stripeAccountStatus] || statusConfig.pending

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color} mb-4`}>
        <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
        {config.text}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {getStatusBadge()}
      
      <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl backdrop-blur-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Stripe Connect Integration
            </h3>
            
            <p className="text-blue-200 text-sm mb-4">
              {instructor?.stripeAccountStatus === 'active' 
                ? 'Your Stripe account is connected and ready to receive payments!'
                : 'Connect your Stripe account to start receiving payments from your classes. Stripe handles secure payouts and tax documentation.'
              }
            </p>

            {instructor?.stripeAccountStatus === 'active' && (
              <div className="text-sm text-green-300 mb-4">
                ✅ Ready to receive payments with {((1 - (instructor.commissionRate || 0.15)) * 100).toFixed(0)}% instructor share
              </div>
            )}
            
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              variant={getButtonVariant()}
              className={`${
                instructor?.stripeAccountStatus === 'active' 
                  ? 'border-white/20 text-white hover:bg-white/10' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              } min-w-[200px]`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {instructor?.stripeAccountStatus === 'pending' && (
        <div className="text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
          <strong>Next Steps:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Click "Connect Stripe Account" above</li>
            <li>Complete the Stripe onboarding process</li>
            <li>Verify your identity and bank account</li>
            <li>Start receiving payments from your classes!</li>
          </ol>
        </div>
      )}
    </div>
  )
}