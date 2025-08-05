'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

// ✅ CUSTOM HOOK: Staffing dashboard state management
export function useStaffingDashboard() {
  const { user, role } = useAuth()
  
  // ✅ STATE: Dashboard data and UI
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [settings, setSettings] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const [submitting, setSubmitting] = useState(false)
  
  // ✅ STATE: Date range
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  // ✅ STATE: Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tempSettings, setTempSettings] = useState(null)

  // ✅ CALLBACK: Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!user || role !== 'merchant') return

    setLoading(true)
    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/dashboard?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDashboard(data.dashboard)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch dashboard data')
        
        // ✅ FALLBACK: Mock data for development
        setDashboard({
          totalClasses: 24,
          assignedClasses: 20,
          needsCoverage: 2,
          classes: [
            {
              id: 1,
              name: 'Morning Yoga',
              instructor: 'Sarah Johnson',
              startTime: '7:00 AM',
              endTime: '8:00 AM',
              date: '2024-01-15',
              capacity: 20,
              hasAssignedInstructor: true,
              needsCoverage: false
            },
            {
              id: 2,
              name: 'HIIT Training',
              instructor: null,
              startTime: '6:00 PM',
              endTime: '7:00 PM', 
              date: '2024-01-15',
              capacity: 15,
              hasAssignedInstructor: false,
              needsCoverage: true
            }
          ],
          pendingSwaps: [
            {
              id: 1,
              message: 'Family emergency, need someone to cover my evening class'
            }
          ],
          openCoverage: [
            {
              id: 1,
              applicants: [],
              message: 'Urgent coverage needed for tomorrow morning'
            }
          ],
          instructors: [
            {
              userId: 1,
              name: 'Sarah Johnson',
              email: 'sarah@example.com',
              specialties: ['Yoga', 'Meditation'],
              experience: '5 years'
            },
            {
              userId: 2,
              name: 'Mike Williams',
              email: 'mike@example.com',
              specialties: ['HIIT', 'Strength Training'],
              experience: '3 years'
            }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Failed to load staffing data')
      
      // ✅ FALLBACK: Basic mock data
      setDashboard({
        totalClasses: 0,
        assignedClasses: 0,
        needsCoverage: 0,
        classes: [],
        pendingSwaps: [],
        openCoverage: [],
        instructors: []
      })
    } finally {
      setLoading(false)
    }
  }, [user, role, dateRange])

  // ✅ CALLBACK: Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!user || role !== 'merchant') return

    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/settings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        // ✅ FALLBACK: Default settings
        setSettings({
          requireSwapApproval: true,
          autoApproveQualified: false,
          minimumCoverageHours: 24,
          notifyAllInstructors: true,
          emailNotifications: true,
          smsNotifications: false,
          dailySummary: true
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // ✅ FALLBACK: Default settings
      setSettings({
        requireSwapApproval: true,
        autoApproveQualified: false,
        minimumCoverageHours: 24,
        notifyAllInstructors: true,
        emailNotifications: true,
        smsNotifications: false,
        dailySummary: true
      })
    }
  }, [user, role])

  // ✅ CALLBACK: Handle swap approval
  const handleApproveSwap = useCallback(async (swapRequestId, approved, reason = '') => {
    if (!user) return

    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/approve-swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            swapRequestId,
            approved,
            reason
          })
        }
      )

      if (response.ok) {
        toast.success(`Swap request ${approved ? 'approved' : 'rejected'} successfully!`)
        await fetchDashboard()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process swap request')
      }
    } catch (error) {
      console.error('Error processing swap request:', error)
      toast.error('Failed to process swap request')
    } finally {
      setSubmitting(false)
    }
  }, [user, fetchDashboard])

  // ✅ CALLBACK: Update settings
  const handleUpdateSettings = useCallback(async () => {
    if (!user || !tempSettings) return

    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(tempSettings)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setShowSettingsModal(false)
        toast.success('Settings updated successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSubmitting(false)
    }
  }, [user, tempSettings])

  // ✅ CALLBACK: Open settings modal
  const openSettings = useCallback(() => {
    setTempSettings({ ...settings })
    setShowSettingsModal(true)
  }, [settings])

  // ✅ EFFECT: Initial data fetch
  useEffect(() => {
    if (user && role === 'merchant') {
      fetchDashboard()
      fetchSettings()
    }
  }, [fetchDashboard, fetchSettings, user, role])

  // ✅ EFFECT: Refetch when date range changes
  useEffect(() => {
    if (user && role === 'merchant') {
      fetchDashboard()
    }
  }, [fetchDashboard, dateRange])

  return {
    // State
    loading,
    dashboard,
    settings,
    activeTab,
    submitting,
    dateRange,
    showSettingsModal,
    tempSettings,

    // Actions
    setActiveTab,
    setDateRange,
    setShowSettingsModal,
    setTempSettings,
    fetchDashboard,
    handleApproveSwap,
    handleUpdateSettings,
    openSettings
  }
}