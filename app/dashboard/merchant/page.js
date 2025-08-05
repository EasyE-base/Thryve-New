'use client'

import { useAuth } from '@/components/auth-provider'
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DashboardLoading } from '@/components/dashboard/LoadingStates'
import MerchantOverview from '@/components/dashboard/merchant/MerchantOverview'
import MerchantClasses from '@/components/dashboard/merchant/MerchantClasses'
import MerchantInstructors from '@/components/dashboard/merchant/MerchantInstructors'
import MerchantCustomers from '@/components/dashboard/merchant/MerchantCustomers'
import MerchantAnalytics from '@/components/dashboard/merchant/MerchantAnalytics'
import MerchantXPass from '@/components/dashboard/merchant/MerchantXPass'
import MerchantCalendar from '@/components/dashboard/merchant/MerchantCalendar'
import MerchantMessages from '@/components/dashboard/merchant/MerchantMessages'
import MerchantSettings from '@/components/dashboard/merchant/MerchantSettings'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

// ✅ MERCHANT DASHBOARD CONTENT COMPONENT
function MerchantDashboardContent() {
  const { activeSection, loading, error, profile } = useDashboard()

  // ✅ RENDER SECTION BASED ON NAVIGATION
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <MerchantOverview />
      case 'classes':
        return <MerchantClasses />
      case 'instructors':
        return <MerchantInstructors />
      case 'customers':
        return <MerchantCustomers />
      case 'analytics':
        return <MerchantAnalytics />
      case 'xpass':
        return <MerchantXPass />
      case 'calendar':
        return <MerchantCalendar />
      case 'messages':
        return <MerchantMessages />
      case 'settings':
        return <MerchantSettings />
      default:
        return <MerchantOverview />
    }
  }

  // ✅ LOADING STATE
  if (loading && !profile) {
    return <DashboardLoading />
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">
            Error loading dashboard
          </div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1E90FF] text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderSection()}
    </div>
  )
}

// ✅ MAIN MERCHANT DASHBOARD PAGE
export default function MerchantDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()

  // ✅ AUTHENTICATION & ROLE CHECK
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in to access your dashboard')
      router.push('/')
      return
    }

    if (role && role !== 'merchant') {
      toast.error('Access denied. Studio owner account required.')
      router.push(`/dashboard/${role}`)
      return
    }
  }, [user, role, authLoading, router])

  // ✅ SHOW LOADING WHILE CHECKING AUTH
  if (authLoading || !user) {
    return <DashboardLoading />
  }

  // ✅ RENDER DASHBOARD WITH PROVIDER
  return (
    <DashboardProvider role="merchant">
      <DashboardLayout role="merchant">
        <MerchantDashboardContent />
      </DashboardLayout>
    </DashboardProvider>
  )
}