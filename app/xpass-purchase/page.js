'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import XPassPurchaseCard from '@/components/XPassPurchaseCard'

export default function XPassPurchasePage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/?signin=true')
      return
    }

    if (role && role !== 'customer') {
      router.push(`/dashboard/${role}`)
      return
    }
  }, [user, role, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-light">Loading X Pass Purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">X Pass Purchase</h1>
            <p className="text-blue-200">Purchase X Pass credits to use at any partner studio</p>
          </div>
          
          <XPassPurchaseCard />
        </div>
      </div>
    </div>
  )
}