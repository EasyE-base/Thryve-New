'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  Clock, 
  DollarSign,
  Filter,
  Search,
  Eye,
  Settings,
  PlayCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import CreateClassModal from './CreateClassModal'
import ScheduleGeneratorModal from './ScheduleGeneratorModal'
import ClassDetailsModal from './ClassDetailsModal'

export default function ClassManagementDashboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    scheduledSessions: 0,
    totalBookings: 0
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'dance', label: 'Dance' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'fitness', label: 'General Fitness' }
  ]

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' }
  ]

  useEffect(() => {
    if (user) {
      fetchClasses()
      fetchStats()
    }
  }, [user])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterLevel !== 'all') params.append('level', filterLevel)
      
      const response = await fetch(`/server-api/classes?${params}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        toast.error('Failed to load classes')
      }
    } catch (error) {
      console.error('Fetch classes error:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get basic stats from classes
      const response = await fetch('/server-api/classes', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const classes = data.classes || []
        
        setStats({
          totalClasses: classes.length,
          activeClasses: classes.filter(c => c.isActive).length,
          scheduledSessions: 0, // Would come from schedules endpoint
          totalBookings: 0 // Would come from bookings endpoint
        })
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  const handleCreateClass = () => {
    setSelectedClass(null)
    setShowCreateModal(true)
  }

  const handleEditClass = (classItem) => {
    setSelectedClass(classItem)
    setShowCreateModal(true)
  }

  const handleViewDetails = (classItem) => {
    setSelectedClass(classItem)
    setShowDetailsModal(true)
  }

  const handleGenerateSchedule = (classItem) => {
    setSelectedClass(classItem)
    setShowScheduleModal(true)
  }

  const handleDeleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/server-api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        toast.success('Class deleted successfully')
        fetchClasses()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete class')
      }
    } catch (error) {
      console.error('Delete class error:', error)
      toast.error('Failed to delete class')
    }
  }

  const handleToggleActive = async (classId, currentStatus) => {
    try {
      const response = await fetch(`/server-api/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(`Class ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchClasses()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update class status')
      }
    } catch (error) {
      console.error('Toggle class status error:', error)
      toast.error('Failed to update class status')
    }
  }

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = !searchTerm || 
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || classItem.category === filterCategory
    const matchesLevel = filterLevel === 'all' || classItem.level === filterLevel

    return matchesSearch && matchesCategory && matchesLevel
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Class Management</h2>
          <p className="text-gray-600 mt-1">
            Create, manage, and schedule your studio classes
          </p>
        </div>
        <Button onClick={handleCreateClass} className="bg-[#1E90FF] hover:bg-[#1976D2]">
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
              <Calendar className="h-8 w-8 text-[#1E90FF]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClasses}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled Sessions</p>
                <p className="text-2xl font-bold text-[#1E90FF]">{stats.scheduledSessions}</p>
              </div>
              <Clock className="h-8 w-8 text-[#1E90FF]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBookings}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>Classes ({filteredClasses.length})</CardTitle>
          <CardDescription>
            Manage your class templates and generate schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== 'all' || filterLevel !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first class to get started'
                }
              </p>
              {!searchTerm && filterCategory === 'all' && filterLevel === 'all' && (
                <Button onClick={handleCreateClass} className="bg-[#1E90FF] hover:bg-[#1976D2]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{classItem.name}</h3>
                        <Badge variant={classItem.isActive ? 'default' : 'secondary'}>
                          {classItem.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {classItem.category}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {classItem.level}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {classItem.description || 'No description provided'}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {classItem.duration} min
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {classItem.capacity} max
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${classItem.price || 'Free'}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {classItem.recurrencePattern}
                        </div>
                      </div>
                      
                      {classItem.tags && classItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {classItem.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(classItem)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSchedule(classItem)}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClass(classItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(classItem.id, classItem.isActive)}
                      >
                        {classItem.isActive ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedClass(null)
        }}
        classData={selectedClass}
        onSuccess={() => {
          fetchClasses()
          fetchStats()
        }}
      />

      <ScheduleGeneratorModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setSelectedClass(null)
        }}
        classData={selectedClass}
        onSuccess={() => {
          toast.success('Schedule generated successfully!')
        }}
      />

      <ClassDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedClass(null)
        }}
        classData={selectedClass}
      />
    </div>
  )
}