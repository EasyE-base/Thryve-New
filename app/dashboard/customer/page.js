'use client'

import { useAuth } from '@/components/auth-provider'
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DashboardLoading } from '@/components/dashboard/LoadingStates'
import CustomerOverview from '@/components/dashboard/customer/CustomerOverview'
import CustomerBookings from '@/components/dashboard/customer/CustomerBookings'
import CustomerDiscover from '@/components/dashboard/customer/CustomerDiscover'
import CustomerXPass from '@/components/dashboard/customer/CustomerXPass'
import CustomerCalendar from '@/components/dashboard/customer/CustomerCalendar'
import CustomerMessages from '@/components/dashboard/customer/CustomerMessages'
import CustomerProfile from '@/components/dashboard/customer/CustomerProfile'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

// ✅ CUSTOMER DASHBOARD CONTENT COMPONENT
function CustomerDashboardContent() {
  const { activeSection, loading, error, profile } = useDashboard()

  // ✅ RENDER SECTION BASED ON NAVIGATION
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <CustomerOverview />
      case 'bookings':
        return <CustomerBookings />
      case 'discover':
        return <CustomerDiscover />
      case 'xpass':
        return <CustomerXPass />
      case 'calendar':
        return <CustomerCalendar />
      case 'messages':
        return <CustomerMessages />
      case 'profile':
        return <CustomerProfile />
      default:
        return <CustomerOverview />
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

// ✅ MAIN CUSTOMER DASHBOARD PAGE
export default function CustomerDashboard() {
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

    if (role && role !== 'customer') {
      toast.error('Access denied. Customer account required.')
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
    <DashboardProvider role="customer">
      <DashboardLayout role="customer">
        <CustomerDashboardContent />
      </DashboardLayout>
    </DashboardProvider>
  )
}