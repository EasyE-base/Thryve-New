'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Building2 } from 'lucide-react'

// ✅ STANDARDIZED LAYOUT: Consistent structure across all dashboards
export default function StandardLayout({
  title,
  description,
  role,
  requiredRole,
  loading,
  error,
  onRefresh,
  headerActions,
  children
}) {
  // ✅ ROLE ACCESS CHECK: Consistent access control
  if (requiredRole && role !== requiredRole) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Access Required</h3>
        <p className="text-blue-200">
          This feature is only available to {requiredRole} users.
        </p>
      </div>
    )
  }

  // ✅ ERROR STATE: Consistent error handling
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
        <p className="text-red-200 mb-6">{error}</p>
        <Button
          onClick={onRefresh}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  // ✅ LOADING STATE: Consistent loading indicator
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/10 rounded-lg p-6">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ✅ MAIN LAYOUT: Consistent structure
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-blue-200 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={onRefresh}
            size="sm"
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {headerActions}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}