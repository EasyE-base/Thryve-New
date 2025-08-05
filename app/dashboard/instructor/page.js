'use client'

import { useAuth } from '@/components/auth-provider'
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DashboardLoading } from '@/components/dashboard/LoadingStates'
import InstructorOverview from '@/components/dashboard/instructor/InstructorOverview'
import InstructorSchedule from '@/components/dashboard/instructor/InstructorSchedule'
import InstructorEarnings from '@/components/dashboard/instructor/InstructorEarnings'
import InstructorSwaps from '@/components/dashboard/instructor/InstructorSwaps'
import InstructorMessages from '@/components/dashboard/instructor/InstructorMessages'
import InstructorProfile from '@/components/dashboard/instructor/InstructorProfile'
import InstructorCalendar from '@/components/dashboard/instructor/InstructorCalendar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

// ✅ INSTRUCTOR DASHBOARD CONTENT COMPONENT
function InstructorDashboardContent() {
  const { activeSection, loading, error, profile } = useDashboard()

  // ✅ RENDER SECTION BASED ON NAVIGATION
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <InstructorOverview />
      case 'schedule':
        return <InstructorSchedule />
      case 'earnings':
        return <InstructorEarnings />
      case 'swaps':
        return <InstructorSwaps />
      case 'calendar':
        return <InstructorCalendar />
      case 'messages':
        return <InstructorMessages />
      case 'profile':
        return <InstructorProfile />
      default:
        return <InstructorOverview />
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

// ✅ MAIN INSTRUCTOR DASHBOARD PAGE
export default function InstructorDashboard() {
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

    if (role && role !== 'instructor') {
      toast.error('Access denied. Instructor account required.')
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
    <DashboardProvider role="instructor">
      <DashboardLayout role="instructor">
        <InstructorDashboardContent />
      </DashboardLayout>
    </DashboardProvider>
  )
}