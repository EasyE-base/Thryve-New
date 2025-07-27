'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, Clock, Users, Star, Calendar, MapPin, 
  Loader2, RefreshCw, Brain, TrendingUp, ArrowRight,
  BookOpen, Target
} from 'lucide-react'
import { toast } from 'sonner'

export default function AIClassRecommendations() {
  const { user, userRole } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRecommendations()
    }
  }, [user])

  const fetchRecommendations = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/recommendations/classes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        if (showRefreshing) {
          toast.success('Recommendations updated with fresh AI insights!')
        }
      } else {
        toast.error('Failed to load AI recommendations')
        console.error('Failed to fetch recommendations:', response.status)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      toast.error('Failed to load AI recommendations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleBookClass = (classItem) => {
    toast.info(`Booking "${classItem.className}" - Integration with booking system coming soon!`)
  }

  const getMatchScoreColor = (score) => {
    if (score >= 9) return 'bg-green-500/20 text-green-200 border-green-400/20'
    if (score >= 7) return 'bg-blue-500/20 text-blue-200 border-blue-400/20'
    if (score >= 5) return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/20'
    return 'bg-red-500/20 text-red-200 border-red-400/20'
  }

  const getDifficultyLevel = (level) => {
    if (!level) return 'All Levels'
    if (typeof level === 'number') {
      if (level <= 3) return 'Beginner'
      if (level <= 7) return 'Intermediate'
      return 'Advanced'
    }
    return level
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">AI Recommendations</h3>
        <p className="text-blue-200">Sign in to get personalized class recommendations powered by AI</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">AI is analyzing your preferences...</h2>
            </div>
            <p className="text-blue-200 mt-1">Creating personalized recommendations just for you</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded"></div>
                    <div className="h-3 bg-white/10 rounded w-4/5"></div>
                  </div>
                  <div className="h-8 bg-white/10 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">AI-Powered Recommendations</h2>
          </div>
          <p className="text-blue-200 mt-1">Personalized class suggestions based on your preferences and goals</p>
        </div>
        
        <Button
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {refreshing ? 'Updating...' : 'Refresh AI Picks'}
        </Button>
      </div>

      {/* AI Insights Panel */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg mr-4">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Analysis Complete</h3>
                  <p className="text-purple-200 text-sm">
                    Found {recommendations.length} perfectly matched classes based on your fitness journey
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                Smart Matching
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Building Your Profile</h3>
          <p className="text-blue-200 mb-6 max-w-md mx-auto">
            Complete your profile and book a few classes to get personalized AI recommendations
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Explore Classes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((classItem, index) => (
            <Card 
              key={classItem.id} 
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group relative overflow-hidden"
            >
              {/* AI Badge */}
              <div className="absolute -top-1 -right-1 z-10">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-bl-lg text-xs font-medium flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Pick #{index + 1}
                </div>
              </div>

              {/* Match Score */}
              <div className="absolute top-4 left-4 z-10">
                <Badge className={`${getMatchScoreColor(classItem.matchScore || 8)} text-xs`}>
                  <Star className="h-3 w-3 mr-1" />
                  {classItem.matchScore || 8}/10 Match
                </Badge>
              </div>

              <CardHeader className="pb-3 pt-12">
                <CardTitle className="text-white text-lg group-hover:text-blue-200 transition-colors">
                  {classItem.className}
                </CardTitle>
                <CardDescription className="text-blue-200">
                  {classItem.classType || 'Fitness'} • {classItem.duration || 60} min • {getDifficultyLevel(classItem.difficultyLevel)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Class Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-blue-200">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(classItem.startTime).toLocaleDateString()} at {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center text-blue-200">
                    <Users className="h-4 w-4 mr-2" />
                    {classItem.assignedInstructorName || 'Instructor TBD'}
                  </div>
                  <div className="flex items-center text-blue-200">
                    <MapPin className="h-4 w-4 mr-2" />
                    {classItem.location || 'Location TBD'}
                  </div>
                </div>

                {/* AI Recommendation Reason */}
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                  <div className="flex items-start">
                    <Brain className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-200 text-sm font-medium mb-1">Why this class?</p>
                      <p className="text-blue-300 text-xs leading-relaxed">
                        {classItem.recommendationReason || 'This class matches your fitness goals and preferences perfectly.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleBookClass(classItem)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    Book Class
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => toast.info('Class details view coming soon!')}
                  >
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center py-6">
        <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
          <span className="text-blue-200 text-sm">
            Recommendations update automatically as you book more classes
          </span>
        </div>
      </div>
    </div>
  )
}