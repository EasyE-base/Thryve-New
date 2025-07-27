'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Brain, Sparkles, Clock, Users, MapPin, 
  Calendar, Loader2, MessageSquare, Lightbulb, 
  Filter, Zap, Target, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

const EXAMPLE_SEARCHES = [
  "30 minute morning yoga for beginners",
  "high intensity workout after work", 
  "gentle stretching class for seniors",
  "strength training for weight loss",
  "meditation classes on weekends"
]

export default function AISmartSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const token = user ? await user.getIdToken() : null
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/ai/search?q=${encodeURIComponent(searchQuery)}`,
        { headers }
      )

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setAiAnalysis(data.aiAnalysis)
        toast.success(`Found ${data.results?.length || 0} classes matching your search!`)
      } else {
        toast.error('Search failed. Please try again.')
        console.error('Search failed:', response.status)
      }
    } catch (error) {
      console.error('Error performing search:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleSearch = (example) => {
    setQuery(example)
    handleSearch(example)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const renderAIAnalysis = () => {
    if (!aiAnalysis) return null

    return (
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-400/20 backdrop-blur-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Search Analysis</h3>
              <p className="text-purple-200 text-sm">Understanding your search intent</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiAnalysis.workoutTypes && aiAnalysis.workoutTypes.length > 0 && (
              <div>
                <h4 className="text-purple-200 font-medium text-sm mb-2">Workout Types</h4>
                <div className="flex flex-wrap gap-1">
                  {aiAnalysis.workoutTypes.map((type, index) => (
                    <Badge key={index} className="bg-blue-500/20 text-blue-200 text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.difficultyLevel && (
              <div>
                <h4 className="text-purple-200 font-medium text-sm mb-2">Difficulty Level</h4>
                <Badge className="bg-green-500/20 text-green-200 text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {aiAnalysis.difficultyLevel}
                </Badge>
              </div>
            )}

            {aiAnalysis.duration && (
              <div>
                <h4 className="text-purple-200 font-medium text-sm mb-2">Duration</h4>
                <Badge className="bg-orange-500/20 text-orange-200 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{aiAnalysis.duration} min
                </Badge>
              </div>
            )}
          </div>

          {aiAnalysis.goals && aiAnalysis.goals.length > 0 && (
            <div className="mt-4">
              <h4 className="text-purple-200 font-medium text-sm mb-2">Detected Goals</h4>
              <div className="flex flex-wrap gap-1">
                {aiAnalysis.goals.map((goal, index) => (
                  <Badge key={index} className="bg-yellow-500/20 text-yellow-200 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <Sparkles className="h-8 w-8 text-blue-400 mr-3" />
          <h2 className="text-3xl font-bold text-white">AI-Powered Smart Search</h2>
        </div>
        <p className="text-blue-200 text-lg max-w-2xl mx-auto">
          Describe what you're looking for in natural language. Our AI understands your fitness goals and finds the perfect classes.
        </p>
      </div>

      {/* Search Interface */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                type="text"
                placeholder="Try: 'beginner yoga class tomorrow morning' or 'intense cardio workout for weight loss'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-4 py-3 bg-white/5 border-white/20 text-white placeholder-blue-300 text-lg"
                disabled={loading}
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Search with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Searches */}
      {!hasSearched && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-400 mr-3" />
              <h3 className="text-white font-semibold">Try these example searches</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {EXAMPLE_SEARCHES.map((example, index) => (
                <Button
                  key={index}
                  onClick={() => handleExampleSearch(example)}
                  variant="outline"
                  className="border-white/20 text-blue-200 hover:bg-white/10 text-sm"
                  disabled={loading}
                >
                  <Zap className="h-3 w-3 mr-2" />
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {renderAIAnalysis()}

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Search Results {results.length > 0 && `(${results.length} found)`}
            </h3>
            {results.length > 0 && (
              <Badge className="bg-green-500/20 text-green-200">
                <Filter className="h-3 w-3 mr-1" />
                AI Filtered
              </Badge>
            )}
          </div>

          {loading ? (
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No classes found</h3>
              <p className="text-blue-200 mb-6 max-w-md mx-auto">
                Try adjusting your search terms or browse our available classes
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Browse All Classes
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((classItem) => (
                <Card 
                  key={classItem.id} 
                  className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg group-hover:text-blue-200 transition-colors">
                          {classItem.className}
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                          {classItem.classType || 'Fitness'} • {classItem.duration || 60} min
                        </CardDescription>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/20 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Match
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
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

                    {classItem.description && (
                      <p className="text-blue-300 text-sm line-clamp-2">
                        {classItem.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => toast.info('Booking integration coming soon!')}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        Book Class
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => toast.info('Class details coming soon!')}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-400/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Brain className="h-5 w-5 text-blue-400 mr-3" />
            <h3 className="text-white font-semibold">AI Search Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="text-blue-200 font-medium">Be specific about:</h4>
              <ul className="text-blue-300 space-y-1">
                <li>• Time preferences (morning, evening, weekends)</li>
                <li>• Fitness level (beginner, advanced)</li>
                <li>• Duration (30 minutes, 1 hour)</li>
                <li>• Workout type (yoga, HIIT, strength)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-blue-200 font-medium">Example searches:</h4>
              <ul className="text-blue-300 space-y-1">
                <li>• "Low impact cardio for knee recovery"</li>
                <li>• "Quick lunch break workout under 45 minutes"</li>
                <li>• "Relaxing evening yoga to reduce stress"</li>
                <li>• "High energy dance class for fun"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}