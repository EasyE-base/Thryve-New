'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BookingCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Show cancellation message
    toast.info('Booking cancelled - no charges were made')
  }, [])

  const handleTryAgain = () => {
    // Go back to the previous page (class detail)
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-bold text-white">Booking Cancelled</h1>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  Browse Classes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Cancellation Message */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
          <CardContent className="p-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-500/20 rounded-full mb-6">
              <XCircle className="h-12 w-12 text-orange-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Booking Cancelled</h1>
            <p className="text-xl text-blue-200 mb-2">Your payment was cancelled and no charges were made.</p>
            <p className="text-blue-300 mb-8">You can try booking again or browse other classes.</p>
            
            <div className="space-y-4">
              <Button
                onClick={handleTryAgain}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Booking Again
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/marketplace">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 px-6"
                  >
                    Browse All Classes
                  </Button>
                </Link>
                
                <Link href="/dashboard/customer">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 px-6"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3">Why might this have happened?</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• You decided to cancel the payment</li>
                <li>• Browser or connection issues during checkout</li>
                <li>• Payment method declined by your bank</li>
                <li>• Session timed out during payment</li>
              </ul>
              
              <p className="text-sm text-blue-300 mt-4">
                If you experienced technical issues, please try booking again or contact support if the problem persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}