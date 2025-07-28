'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  Users, 
  Heart,
  Play,
  Award,
  Zap,
  Target,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Trophy
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function MarketplacePage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentSwipe, setCurrentSwipe] = useState(0)
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    classType: [],
    location: '',
    priceRange: [0, 100],
    availability: [],
    certifications: [],
    rating: 0,
    languages: []
  })
  
  const swipeRef = useRef(null)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Fetch instructors from API
  const fetchInstructors = async () => {
    try {
      const response = await fetch('/server-api/marketplace/instructors')
      
      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors || [])
      } else {
        console.error('Failed to fetch instructors')
        // Set empty array as fallback
        setInstructors([])
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
      setInstructors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstructors()
  }, [])

  // Filter instructors based on search and filters
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = !searchQuery || 
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.specialties?.some(specialty => 
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      instructor.location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilters = (
      (filters.classType.length === 0 || 
       instructor.specialties?.some(specialty => 
         filters.classType.includes(specialty)
       )) &&
      (filters.location === '' || 
       instructor.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (instructor.hourlyRate || 0) >= filters.priceRange[0] &&
      (instructor.hourlyRate || 0) <= filters.priceRange[1] &&
      (instructor.rating || 0) >= filters.rating
    )
    
    return matchesSearch && matchesFilters
  })

  // Touch handlers for swipe functionality
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setCurrentSwipe(prev => Math.min(prev + 1, featuredInstructors.length - 1))
    }
    if (isRightSwipe) {
      setCurrentSwipe(prev => Math.max(prev - 1, 0))
    }
  }

  const featuredInstructors = filteredInstructors.filter(i => i.featured)

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSwipe(prev => (prev + 1) % Math.max(featuredInstructors.length, 1))
    }, 6000)
    return () => clearInterval(interval)
  }, [featuredInstructors.length])

  const goToSlide = (index) => {
    setCurrentSwipe(index)
  }

  const nextSlide = () => {
    setCurrentSwipe(prev => (prev + 1) % featuredInstructors.length)
  }

  const prevSlide = () => {
    setCurrentSwipe(prev => (prev - 1 + featuredInstructors.length) % featuredInstructors.length)
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header with Gradient */}
      <header className="bg-black/20 backdrop-blur-xl shadow-modern border-b border-white/10 sticky top-0 z-50">
        <div className="mobile-container">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="btn-modern-small text-white hover:bg-white/10 p-3 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="animate-fadeInLeft">
                <h1 className="text-3xl font-bold text-gradient">Marketplace</h1>
                <p className="text-sm text-blue-200">Find your perfect fitness instructor</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-modern-small bg-white/10 border border-white/20 md:hidden"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <div className="hidden md:flex items-center space-x-2 text-blue-200 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>{filteredInstructors.length} instructors available</span>
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative mb-6 animate-fadeInUp delay-200">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <Input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern pl-12 text-lg py-4"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                {filteredInstructors.length} found
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Modern Filters Sidebar */}
          <div className={`space-y-6 ${showFilters ? 'block' : 'hidden'} lg:block animate-slideInLeft`}>
            <Card className="card-modern p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </h3>
                <Button
                  onClick={() => setShowFilters(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 lg:hidden rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Enhanced Class Type Filter */}
              <div className="mb-6">
                <Label className="text-white font-medium mb-4 block flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Class Type
                </Label>
                <div className="space-y-3">
                  {['🧘 Yoga', '🔥 HIIT', '💪 Pilates', '🏋️ Strength', '💃 Dance', '🥊 Boxing'].map((type) => (
                    <div key={type} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <Checkbox 
                        id={type.toLowerCase()}
                        className="border-white/30 text-blue-500 rounded-md"
                      />
                      <Label 
                        htmlFor={type.toLowerCase()} 
                        className="text-blue-200 text-sm cursor-pointer flex-1"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Price Range */}
              <div className="mb-6">
                <Label className="text-white font-medium mb-4 block flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Price Range
                </Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                    max={100}
                    step={5}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm">
                    <Badge className="bg-blue-500/20 text-blue-300">${filters.priceRange[0]}</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">${filters.priceRange[1]}</Badge>
                  </div>
                </div>
              </div>

              {/* Enhanced Availability */}
              <div className="mb-6">
                <Label className="text-white font-medium mb-4 block flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Availability
                </Label>
                <div className="space-y-3">
                  {['⚡ Available Now', '📅 Today', '🌅 Tomorrow', '📍 This Week'].map((time) => (
                    <div key={time} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <Checkbox 
                        id={time.toLowerCase().replace(' ', '-')}
                        className="border-white/30 text-blue-500 rounded-md"
                      />
                      <Label 
                        htmlFor={time.toLowerCase().replace(' ', '-')} 
                        className="text-blue-200 text-sm cursor-pointer flex-1"
                      >
                        {time}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Rating Filter */}
              <div>
                <Label className="text-white font-medium mb-4 block flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Minimum Rating
                </Label>
                <div className="flex items-center space-x-3 px-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Slider
                    value={[filters.rating]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value[0] }))}
                    max={5}
                    step={0.5}
                    className="flex-1"
                  />
                  <Badge className="bg-yellow-500/20 text-yellow-300 w-12 text-center">
                    {filters.rating}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Featured Instructors Carousel - Mobile Optimized */}
            <div className="animate-fadeInUp delay-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">✨ Featured Instructors</h2>
                  <p className="text-blue-200">Hand-picked top-rated professionals</p>
                </div>
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    onClick={prevSlide}
                    variant="outline"
                    size="sm"
                    className="btn-modern-small border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={nextSlide}
                    variant="outline"
                    size="sm"
                    className="btn-modern-small border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Swipeable Carousel */}
              <div 
                className="relative overflow-hidden rounded-3xl shadow-modern"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent"></div>
                  </div>
                ) : featuredInstructors.length > 0 ? (
                  <>
                    <div 
                      ref={swipeRef}
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${currentSwipe * 100}%)` }}
                    >
                      {featuredInstructors.map((instructor) => (
                        <div key={instructor.id} className="card-swipe">
                          <Card className="card-modern overflow-hidden h-[500px]">
                            <div 
                              className="relative h-64 bg-cover bg-center"
                              style={{
                                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("${instructor.imageUrl}")`,
                              }}
                            >
                              <div className="absolute top-4 left-4 flex space-x-2">
                                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white backdrop-blur-sm animate-pulse-glow">
                                  {instructor.availability}
                                </Badge>
                                {instructor.achievements.map((achievement, index) => (
                                  <Badge key={index} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white backdrop-blur-sm">
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                              <div className="absolute top-4 right-4 flex space-x-2">
                                {instructor.videoIntro && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white backdrop-blur-sm">
                                    <Play className="h-3 w-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full tap-target"
                                  onClick={() => toast.success('Added to favorites! ❤️')}
                                >
                                  <Heart className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                              <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-3xl font-bold text-white mb-2 animate-fadeInUp">{instructor.name}</h3>
                                <p className="text-blue-200 text-lg animate-fadeInUp delay-100">{instructor.tagline}</p>
                              </div>
                            </div>

                            <CardContent className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                                    <span className="text-white font-bold text-lg">{instructor.rating}</span>
                                    <span className="text-blue-200 text-sm ml-1">({instructor.reviewCount} reviews)</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-gradient">${instructor.hourlyRate}</div>
                                  <div className="text-xs text-blue-200">per session</div>
                                </div>
                              </div>

                              <div className="text-blue-200 text-sm flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {instructor.location}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {instructor.specialties.map((specialty) => (
                                  <Badge key={specialty} className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border border-blue-400/30">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex space-x-2">
                                {instructor.videoIntro && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="btn-modern-small border-white/20 text-white hover:bg-white/10"
                                    onClick={() => toast.info('🎬 Video preview coming soon!')}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                )}
                                <Link href={`/instructor/${instructor.id}`}>
                                  <Button
                                    size="sm"
                                    className="btn-modern-small bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105"
                                  >
                                    View Profile
                                  </Button>
                                </Link>
                                <Link href={`/class/morning-vinyasa-flow`}>
                                  <Button
                                    size="sm"
                                    className="btn-modern-small bg-gradient-to-r from-purple-500 to-purple-600 hover:scale-105"
                                  >
                                    View Classes
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  className="btn-modern-small bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 flex-1"
                                  onClick={() => toast.success('🎯 Booking request sent!')}
                                >
                                  Book Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>

                    {/* Swipe Indicators */}
                    <div className="swipe-indicator mt-6">
                      {featuredInstructors.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`swipe-dot tap-target ${index === currentSwipe ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-white/60 text-lg">No featured instructors found matching your criteria</p>
                    <p className="text-white/40 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* All Instructors Grid */}
            <div className="animate-fadeInUp delay-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">🌟 All Instructors</h2>
                  <p className="text-blue-200">Discover your perfect fitness match</p>
                </div>
                <div className="text-blue-200">
                  <Trophy className="h-5 w-5 inline mr-2" />
                  {filteredInstructors.length} professionals available
                </div>
              </div>

              <div className="mobile-grid">
                {filteredInstructors.map((instructor, index) => (
                  <Card key={instructor.id} className={`card-modern overflow-hidden animate-fadeInUp delay-${(index % 3) * 100}`}>
                    <div 
                      className="relative h-48 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("${instructor.imageUrl}")`,
                      }}
                    >
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white backdrop-blur-sm text-xs">
                          {instructor.availability}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full w-8 h-8 p-0 tap-target"
                          onClick={() => toast.success('❤️ Added to favorites!')}
                        >
                          <Heart className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-bold text-white mb-1">{instructor.name}</h3>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <p className="text-blue-200 text-sm">{instructor.tagline}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-white font-medium">{instructor.rating}</span>
                          <span className="text-blue-200 text-xs ml-1">({instructor.reviewCount})</span>
                        </div>
                        <div className="text-xl font-bold text-gradient">${instructor.hourlyRate}</div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {instructor.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 text-xs border border-blue-400/30">
                            {specialty}
                          </Badge>
                        ))}
                        {instructor.specialties.length > 2 && (
                          <Badge className="bg-white/10 text-blue-300 text-xs">
                            +{instructor.specialties.length - 2} more
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Link href={`/instructor/${instructor.id}`} className="flex-1">
                            <Button
                              size="sm"
                              className="btn-modern-small bg-gradient-to-r from-blue-500 to-blue-600 w-full text-xs hover:scale-105"
                            >
                              Profile
                            </Button>
                          </Link>
                          <Link href={`/class/morning-vinyasa-flow`} className="flex-1">
                            <Button
                              size="sm"
                              className="btn-modern-small bg-gradient-to-r from-purple-500 to-purple-600 w-full text-xs hover:scale-105"
                            >
                              Classes
                            </Button>
                          </Link>
                        </div>
                        <Button
                          size="sm"
                          className="btn-modern-small bg-gradient-to-r from-green-500 to-green-600 w-full text-xs hover:scale-105"
                          onClick={() => toast.success('🎉 Booking request sent!')}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-12">
                <Button
                  className="btn-modern px-12 py-4 text-lg"
                  onClick={() => toast.info('🔄 More instructors loading soon!')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Load More Instructors
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}