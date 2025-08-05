'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar, Clock, Users, UserCheck, Settings, 
  RefreshCw, Building2
} from 'lucide-react'

// ✅ EXTRACTED: Staffing dashboard layout with tabs
export default function StaffingLayout({ 
  role,
  dashboard,
  loading,
  activeTab,
  setActiveTab,
  dateRange,
  setDateRange,
  onRefresh,
  onOpenSettings,
  children 
}) {
  if (role !== 'merchant') {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Studio Access Required</h3>
        <p className="text-blue-200">This feature is only available to studio owners.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Staffing Management</h1>
          <p className="text-blue-200 mt-1">Manage instructors, schedules, and shift coverage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={onRefresh}
            disabled={loading}
            size="sm"
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={onOpenSettings}
            size="sm"
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="start-date" className="text-white text-sm">From:</Label>
          <Input
            id="start-date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="end-date" className="text-white text-sm">To:</Label>
          <Input
            id="end-date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Classes</p>
                <p className="text-2xl font-bold text-white">{dashboard.totalClasses || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Assigned</p>
                <p className="text-2xl font-bold text-white">{dashboard.assignedClasses || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Needs Coverage</p>
                <p className="text-2xl font-bold text-white">{dashboard.needsCoverage || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Active Instructors</p>
                <p className="text-2xl font-bold text-white">{dashboard.instructors?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
        <div className="flex space-x-1">
          {[
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'approvals', label: 'Approvals', icon: UserCheck, count: dashboard?.pendingSwaps?.length },
            { id: 'coverage', label: 'Coverage', icon: Clock, count: dashboard?.openCoverage?.length },
            { id: 'instructors', label: 'Instructors', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500/30 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              {tab.count > 0 && (
                <Badge className="ml-2 bg-red-500/20 text-red-200 text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-spin opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Staffing Data</h3>
          <p className="text-blue-200">Please wait while we fetch your staffing information...</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}