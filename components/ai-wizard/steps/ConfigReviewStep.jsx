'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Settings, Calendar, DollarSign, Users, Clock, MapPin } from 'lucide-react'

// ✅ EXTRACTED: Configuration review step
export default function ConfigReviewStep({ 
  configuration, 
  preferences, 
  onUpdatePreferences,
  loading 
}) {
  if (!configuration) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70">Configuration will appear here after analysis</p>
      </div>
    )
  }

  const handlePreferenceChange = (key, value) => {
    onUpdatePreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Review Your Configuration</h3>
        <p className="text-white/70">Customize your studio setup before implementation</p>
      </div>

      {/* Class Schedule Configuration */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Calendar className="h-5 w-5 mr-2" />
            Recommended Class Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configuration.classSchedule?.map((classItem, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">{classItem.type}</div>
                <div className="text-sm text-white/60">
                  {classItem.days} • {classItem.time} • {classItem.duration}min
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-white border-white/30">
                  {classItem.capacity} spots
                </Badge>
                <Switch 
                  checked={preferences[`class_${index}`] !== false}
                  onCheckedChange={(checked) => handlePreferenceChange(`class_${index}`, checked)}
                />
              </div>
            </div>
          )) || (
            <div className="text-white/60">No schedule recommendations available</div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Strategy */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <DollarSign className="h-5 w-5 mr-2" />
            Pricing Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-2">Drop-in Classes</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${configuration.pricing?.dropIn || '25'}
              </div>
              <div className="text-sm text-white/60">Per class</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-2">Monthly Unlimited</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${configuration.pricing?.monthly || '149'}
              </div>
              <div className="text-sm text-white/60">Per month</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-2">Class Packages</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${configuration.pricing?.package || '200'}
              </div>
              <div className="text-sm text-white/60">10 classes</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-2">Intro Offer</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${configuration.pricing?.intro || '39'}
              </div>
              <div className="text-sm text-white/60">First month</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-600/20 rounded-lg">
            <div className="text-white">
              <div className="font-medium">Enable Dynamic Pricing</div>
              <div className="text-sm text-white/60">Adjust prices based on demand</div>
            </div>
            <Switch 
              checked={preferences.dynamicPricing !== false}
              onCheckedChange={(checked) => handlePreferenceChange('dynamicPricing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Studio Policies */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Settings className="h-5 w-5 mr-2" />
            Studio Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">24-hour Cancellation</div>
                <div className="text-sm text-white/60">Standard policy</div>
              </div>
              <Switch 
                checked={preferences.cancellation24h !== false}
                onCheckedChange={(checked) => handlePreferenceChange('cancellation24h', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">No-show Fee</div>
                <div className="text-sm text-white/60">${configuration.policies?.noShowFee || '15'}</div>
              </div>
              <Switch 
                checked={preferences.noShowFee !== false}
                onCheckedChange={(checked) => handlePreferenceChange('noShowFee', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">Waitlist Auto-promotion</div>
                <div className="text-sm text-white/60">Fill spots automatically</div>
              </div>
              <Switch 
                checked={preferences.autoWaitlist !== false}
                onCheckedChange={(checked) => handlePreferenceChange('autoWaitlist', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">Thryve X Pass</div>
                <div className="text-sm text-white/60">Cross-studio bookings</div>
              </div>
              <Switch 
                checked={preferences.xPassEnabled !== false}
                onCheckedChange={(checked) => handlePreferenceChange('xPassEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <MapPin className="h-5 w-5 mr-2" />
            Recommended Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {configuration.integrations?.map((integration, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">
                <div className="font-medium">{integration.name}</div>
                <div className="text-sm text-white/60">{integration.description}</div>
              </div>
              <Switch 
                checked={preferences[`integration_${integration.id}`] !== false}
                onCheckedChange={(checked) => handlePreferenceChange(`integration_${integration.id}`, checked)}
              />
            </div>
          )) || (
            <div className="text-white/60">No integrations recommended</div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-400/30">
        <CardContent className="p-6">
          <h4 className="text-white font-bold text-lg mb-4">Configuration Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {configuration.summary?.totalClasses || '12'}
              </div>
              <div className="text-white/70 text-sm">Classes/Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${configuration.summary?.projectedRevenue || '8,500'}
              </div>
              <div className="text-white/70 text-sm">Monthly Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {configuration.summary?.setupTime || '2-3'}
              </div>
              <div className="text-white/70 text-sm">Weeks to Launch</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}