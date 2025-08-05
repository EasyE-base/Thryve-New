'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Edit, Trash2, Users, Clock, Calendar } from 'lucide-react'
import { TableLoading } from '@/components/dashboard/LoadingStates'

export default function MerchantClasses() {
  const { classes, loading, createClass } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')

  if (loading) return <TableLoading title="Loading classes..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-gray-600">Manage your studio's class schedule</p>
        </div>
        <Button onClick={() => createClass({})}>
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(classes || []).map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cls.name || 'Yoga Class'}</h3>
                    <p className="text-sm text-gray-600">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {cls.time || '9:00 AM'} • {cls.instructor || 'Instructor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {cls.booked || 8}/{cls.capacity || 15}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}