'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Search, Star, MapPin, Clock, Users, Heart, Zap } from 'lucide-react'

export default function CustomerDiscover() {
  const [searchTerm, setSearchTerm] = useState('')

  // Mock AI recommendations
  const aiRecommendations = [
    {
      id: 1,
      name: 'Beginner Yoga Flow',
      studio: 'Zen Wellness',
      instructor: 'Sarah M.',
      time: '7:00 PM',
      date: 'Tomorrow',
      rating: 4.9,
      reason: 'Perfect for your yoga journey',
      price: 25,
      xPassEligible: true,
      difficulty: 'Beginner'
    },
    {
      id: 2,
      name: 'HIIT Cardio Blast',
      studio: 'FitZone',
      instructor: 'Mike C.',
      time: '6:00 AM',
      date: 'Jan 22',
      rating: 4.7,
      reason: 'High-energy workout you love',
      price: 30,
      xPassEligible: false,
      difficulty: 'Advanced'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Bot className="h-6 w-6 text-[#1E90FF]" />
          <span>Discover Classes</span>
        </h1>
        <p className="text-gray-600">AI-powered recommendations just for you</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for classes, studios, or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-[#1E90FF]" />
            <span>Recommended for You</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiRecommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{rec.name}</h3>
                      <Badge variant="outline">{rec.difficulty}</Badge>
                      {rec.xPassEligible && (
                        <Badge className="bg-orange-100 text-orange-700">
                          <Zap className="h-3 w-3 mr-1" />
                          X Pass
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{rec.studio}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{rec.instructor}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{rec.date} • {rec.time}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{rec.rating}</span>
                        </span>
                      </div>
                      
                      <div className="text-blue-600 text-xs">
                        🤖 {rec.reason}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-semibold text-green-600 mb-2">${rec.price}</div>
                    <div className="space-y-2">
                      <Button size="sm" className="w-full">
                        Book Now
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Heart className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}