'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  User, 
  Tag, 
  AlertCircle,
  CheckCircle,
  Star,
  MapPin,
  Repeat,
  Shield,
  Award
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function ClassDetailsModal({ isOpen, onClose, classData }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [detailedData, setDetailedData] = useState(null)
  const [upcomingInstances, setUpcomingInstances] = useState([])

  useEffect(() => {
    if (isOpen && classData) {
      fetchClassDetails()
    }
  }, [isOpen, classData])

  const fetchClassDetails = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/server-api/classes/${classData.id}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDetailedData(data.class)
        setUpcomingInstances(data.upcomingInstances || [])
      }
    } catch (error) {
      console.error('Fetch class details error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !classData) return null

  const displayData = detailedData || classData

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="pr-12">
            <CardTitle className="text-2xl mb-2">{displayData.name}</CardTitle>
            <CardDescription className="text-base">
              {displayData.description || 'No description provided'}
            </CardDescription>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={displayData.isActive ? 'default' : 'secondary'}>
                {displayData.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {displayData.category}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {displayData.level}
              </Badge>
              {displayData.memberPlusOnly && (
                <Badge variant="default" className="bg-purple-600">
                  Member+ Only
                </Badge>
              )}
              {displayData.xPassEligible && (
                <Badge variant="outline">
                  X Pass Eligible
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg font-bold">{displayData.duration} min</p>
                    </div>
                    <Clock className="h-6 w-6 text-[#1E90FF]" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="text-lg font-bold">{displayData.capacity}</p>
                    </div>
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-bold">
                        {displayData.price > 0 ? `$${displayData.price}` : 'Free'}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-purple-500" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pattern</p>
                      <p className="text-lg font-bold capitalize">
                        {displayData.recurrencePattern}
                      </p>
                    </div>
                    <Repeat className="h-6 w-6 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Scheduling Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-[#1E90FF]" />
                  Scheduling Details
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <p className="text-gray-900">{displayData.startTime}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Recurrence</label>
                      <p className="text-gray-900 capitalize">{displayData.recurrencePattern}</p>
                    </div>
                  </div>
                  
                  {displayData.scheduleDays && displayData.scheduleDays.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Schedule Days</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {displayData.scheduleDays.map((day, index) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements & Prerequisites */}
              {displayData.requirements && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Requirements
                  </h3>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-orange-800">{displayData.requirements}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {displayData.tags && displayData.tags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Tags
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {displayData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor Information */}
              {displayData.defaultInstructorId && detailedData?.instructor && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Default Instructor
                  </h3>
                  
                  <Card className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h4 className="font-semibold">{detailedData.instructor.name}</h4>
                        {detailedData.instructor.bio && (
                          <p className="text-gray-600 mt-1">{detailedData.instructor.bio}</p>
                        )}
                        
                        {detailedData.instructor.specialties && detailedData.instructor.specialties.length > 0 && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-gray-700">Specialties</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {detailedData.instructor.specialties.map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {detailedData.instructor.experience && (
                          <div className="mt-2">
                            <label className="text-sm font-medium text-gray-700">Experience</label>
                            <p className="text-gray-600">{detailedData.instructor.experience}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Upcoming Instances */}
              {upcomingInstances.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Upcoming Classes ({upcomingInstances.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {upcomingInstances.slice(0, 5).map((instance, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {new Date(instance.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(instance.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {instance.bookedCount || 0} / {instance.capacity} booked
                          </div>
                          <Badge variant={instance.availableSpots > 0 ? 'default' : 'secondary'}>
                            {instance.availableSpots > 0 ? 'Available' : 'Full'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {upcomingInstances.length > 5 && (
                      <div className="text-center py-2 text-gray-600 text-sm">
                        ... and {upcomingInstances.length - 5} more upcoming classes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Studio Information */}
              {detailedData?.studio && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Studio Information
                  </h3>
                  
                  <Card className="p-4">
                    <h4 className="font-semibold">{detailedData.studio.name}</h4>
                    {detailedData.studio.description && (
                      <p className="text-gray-600 mt-1">{detailedData.studio.description}</p>
                    )}
                  </Card>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Class Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Created</label>
                    <p className="text-gray-600">
                      {new Date(displayData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-600">
                      {new Date(displayData.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="font-medium text-gray-700">Class ID</label>
                    <p className="text-gray-600 font-mono text-xs">{displayData.id}</p>
                  </div>
                  
                  <div>
                    <label className="font-medium text-gray-700">Status</label>
                    <div className="flex items-center mt-1">
                      {displayData.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400 mr-1" />
                      )}
                      <span className={displayData.isActive ? 'text-green-600' : 'text-gray-600'}>
                        {displayData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}