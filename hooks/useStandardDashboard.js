'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

// ✅ STANDARDIZED HOOK: Universal dashboard pattern
export function useStandardDashboard({
  apiEndpoint,
  requiredRole = null,
  initialFilters = {},
  autoRefreshInterval = null
}) {
  const { user, role } = useAuth()
  
  // ✅ STANDARD STATE: Consistent across all dashboards
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [submitting, setSubmitting] = useState(false)

  // ✅ ROLE VALIDATION: Consistent access control
  const hasAccess = useMemo(() => {
    if (!requiredRole) return true
    return role === requiredRole
  }, [role, requiredRole])

  // ✅ STANDARD FETCH: Consistent API pattern
  const fetchData = useCallback(async () => {
    if (!user || !hasAccess) return

    setLoading(true)
    setError(null)
    
    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams(filters)
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${apiEndpoint}?${params}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setData(result.data || result)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint}:`, error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [user, hasAccess, apiEndpoint, filters])

  // ✅ STANDARD SUBMIT: Consistent form submission
  const submitData = useCallback(async (endpoint, payload, options = {}) => {
    if (!user) return false

    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`,
        {
          method: options.method || 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        if (options.refreshOnSuccess !== false) {
          await fetchData()
        }
        return result
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Operation failed')
      }
    } catch (error) {
      console.error(`Error submitting to ${endpoint}:`, error)
      toast.error(error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [user, fetchData])

  // ✅ STANDARD REFRESH: Consistent data refresh
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // ✅ AUTO REFRESH: Optional auto-refresh
  useEffect(() => {
    if (autoRefreshInterval && data) {
      const interval = setInterval(fetchData, autoRefreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefreshInterval, data, fetchData])

  // ✅ INITIAL FETCH: Load data on mount
  useEffect(() => {
    if (user && hasAccess) {
      fetchData()
    }
  }, [fetchData, user, hasAccess])

  return {
    // State
    loading,
    data,
    error,
    filters,
    submitting,
    hasAccess,

    // Actions
    setFilters,
    submitData,
    refresh,
    fetchData
  }
}