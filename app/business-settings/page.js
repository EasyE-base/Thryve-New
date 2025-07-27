'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BusinessSettingsCard from '@/components/BusinessSettingsCard'

export default function BusinessSettingsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/?signin=true')
      return
    }

    if (role && role !== 'merchant') {
      router.push(`/dashboard/${role}`)
      return
    }
  }, [user, role, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-light">Loading Business Settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Business Settings</h1>
            <p className="text-blue-200">Configure your studio's business model and X Pass settings</p>
          </div>
          
          <BusinessSettingsCard />
        </div>
      </div>
    </div>
  )
}