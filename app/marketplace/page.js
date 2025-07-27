'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  Heart,
  Eye,
  MessageCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Phone,
  Video,
  Globe,
  Dumbbell,
  CheckCircle,
  ArrowLeft,
  Users,
  DollarSign,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

// Sample instructor data
const instructorData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    tagline: 'Yoga with Mindfulness',
    specialties: ['Yoga', 'Vinyasa', 'Meditation'],
    location: 'New York, NY',
    virtual: true,
    rating: 4.9,
    reviewCount: 127,
    pricePerClass: 85,
    experience: '5+ years',
    languages: ['English', 'Spanish'],
    certifications: ['RYT-200', 'NASM', 'CPR'],
    verified: true,
    image: null,
    availability: 'Morning, Evening',
    bio: 'Certified yoga instructor with 5+ years of experience helping students find balance and strength.',
    videoIntro: true,
    bookmarked: false,
    matchPercentage: 95
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    tagline: 'HIIT with Heart',
    specialties: ['HIIT', 'Strength', 'Cardio'],
    location: 'Virtual',
    virtual: true,
    rating: 4.7,
    reviewCount: 89,
    pricePerClass: 75,
    experience: '3+ years',
    languages: ['English'],
    certifications: ['ACSM', 'NASM'],
    verified: true,
    image: null,
    availability: 'Afternoon, Evening',
    bio: 'High-energy HIIT specialist focused on functional fitness and sustainable results.',
    videoIntro: true,
    bookmarked: true,
    matchPercentage: 88
  },
  {
    id: 3,
    name: 'Emma Chen',
    tagline: 'Pilates Perfection',
    specialties: ['Pilates', 'Mat Work', 'Barre'],
    location: 'San Francisco, CA',
    virtual: false,
    rating: 5.0,
    reviewCount: 156,
    pricePerClass: 95,
    experience: '7+ years',
    languages: ['English', 'Mandarin'],
    certifications: ['PMA', 'BASI'],
    verified: true,
    image: null,
    availability: 'Morning, Afternoon',
    bio: 'Pilates master instructor specializing in precise movement and core strengthening.',
    videoIntro: false,
    bookmarked: false,
    matchPercentage: 92
  },
  {
    id: 4,
    name: 'David Wilson',
    tagline: 'Strength & Conditioning',
    specialties: ['Weightlifting', 'CrossFit', 'Functional'],
    location: 'Chicago, IL',
    virtual: true,
    rating: 4.8,
    reviewCount: 203,
    pricePerClass: 90,
    experience: '8+ years',
    languages: ['English'],
    certifications: ['CSCS', 'CrossFit L2'],
    verified: true,
    image: null,
    availability: 'Morning, Afternoon, Evening',
    bio: 'Strength coach with expertise in building functional fitness and athletic performance.',
    videoIntro: true,
    bookmarked: false,
    matchPercentage: 85
  },
  {
    id: 5,
    name: 'Olivia Martinez',
    tagline: 'Dance Fusion',
    specialties: ['Dance', 'Zumba', 'Hip Hop'],
    location: 'Miami, FL',
    virtual: true,
    rating: 4.9,
    reviewCount: 174,
    pricePerClass: 70,
    experience: '6+ years',
    languages: ['English', 'Spanish'],
    certifications: ['ZIN', 'ACE'],
    verified: true,
    image: null,
    availability: 'Evening',
    bio: 'Dance fitness instructor bringing energy and fun to every workout session.',
    videoIntro: true,
    bookmarked: true,
    matchPercentage: 90
  },
  {
    id: 6,
    name: 'James Thompson',
    tagline: 'Spin Master',
    specialties: ['Spin', 'Cycling', 'Endurance'],
    location: 'Boston, MA',
    virtual: false,
    rating: 4.6,
    reviewCount: 142,
    pricePerClass: 80,
    experience: '4+ years',
    languages: ['English'],
    certifications: ['Spinning', 'ACSM'],
    verified: true,
    image: null,
    availability: 'Morning, Evening',
    bio: 'Indoor cycling specialist focused on high-energy rides and endurance building.',
    videoIntro: false,
    bookmarked: false,
    matchPercentage: 78
  }
]

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('relevance')
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [filteredInstructors, setFilteredInstructors] = useState(instructorData)
  const [bookmarkedInstructors, setBookmarkedInstructors] = useState(new Set([2, 5]))
  
  // Filter states
  const [filters, setFilters] = useState({
    classTypes: [],
    location: 'all',
    priceRange: [20, 100],
    availability: [],
    certifications: [],
    rating: 0,
    languages: [],
    virtual: false
  })
  
  // Filter panel states
  const [expandedFilters, setExpandedFilters] = useState({
    classType: true,
    location: true,
    priceRange: true,
    availability: false,
    certifications: false,
    rating: false,
    languages: false
  })

  const router = useRouter()

  const classTypes = ['Yoga', 'Pilates', 'HIIT', 'Spin', 'Personal Training', 'Dance', 'Strength', 'Cardio']
  const availabilityOptions = ['Morning', 'Afternoon', 'Evening', 'Weekends']
  const certificationOptions = ['RYT-200', 'RYT-500', 'NASM', 'ACSM', 'ACE', 'CSCS', 'PMA', 'BASI']
  const languageOptions = ['English', 'Spanish', 'French', 'Mandarin', 'German']

  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value) 
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }))
  }

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleBookmark = (instructorId) => {
    setBookmarkedInstructors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId)
        toast.success('Removed from bookmarks')
      } else {
        newSet.add(instructorId)
        toast.success('Added to bookmarks')
      }
      return newSet
    })
  }

  const clearAllFilters = () => {
    setFilters({
      classTypes: [],
      location: 'all',
      priceRange: [20, 100],
      availability: [],
      certifications: [],
      rating: 0,
      languages: [],
      virtual: false
    })
    setSearchTerm('')
  }

  // Filter instructors based on current filters
  useEffect(() => {
    let filtered = instructorData

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Class type filter
    if (filters.classTypes.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.specialties.some(specialty => filters.classTypes.includes(specialty))
      )
    }

    // Price range filter
    filtered = filtered.filter(instructor =>
      instructor.pricePerClass >= filters.priceRange[0] &&
      instructor.pricePerClass <= filters.priceRange[1]
    )

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(instructor => instructor.rating >= filters.rating)
    }

    // Virtual filter
    if (filters.virtual) {
      filtered = filtered.filter(instructor => instructor.virtual)
    }

    // Languages filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.languages.some(lang => filters.languages.includes(lang))
      )
    }

    // Certifications filter
    if (filters.certifications.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.certifications.some(cert => filters.certifications.includes(cert))
      )
    }

    // Sort results
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.pricePerClass - b.pricePerClass)
        break
      case 'price-high':
        filtered.sort((a, b) => b.pricePerClass - a.pricePerClass)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'match':
        filtered.sort((a, b) => b.matchPercentage - a.matchPercentage)
        break
      default:
        // relevance - keep original order
        break
    }

    setFilteredInstructors(filtered)
  }, [searchTerm, filters, sortBy])

  const InstructorCard = ({ instructor, isBookmarked }) => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-blue-400/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-lg">
                  {instructor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {instructor.verified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{instructor.name}</h3>
              <p className="text-blue-200 text-sm">{instructor.tagline}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm ml-1">{instructor.rating}</span>
                  <span className="text-blue-300 text-sm ml-1">({instructor.reviewCount})</span>
                </div>
                {instructor.matchPercentage > 90 && (
                  <Badge className="bg-green-500/20 text-green-200 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Match
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleBookmark(instructor.id)}
              className="text-white hover:text-blue-400 hover:bg-white/10"
            >
              <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current text-red-400' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Share feature coming soon!')}
              className="text-white hover:text-blue-400 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {instructor.specialties.map((specialty, index) => (
              <Badge key={index} className="bg-blue-500/20 text-blue-200 text-xs">
                {specialty}
              </Badge>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-sm text-blue-200">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {instructor.location}
            </div>
            {instructor.virtual && (
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-1" />
                Virtual
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-blue-200">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {instructor.availability}
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              {instructor.languages.join(', ')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${instructor.pricePerClass}</p>
              <p className="text-blue-200 text-sm">per class</p>
            </div>
            <div className="flex space-x-2">
              {instructor.videoIntro && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => toast.info('Video preview coming soon!')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              )}
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={() => toast.success('Viewing profile...')}
              >
                View Profile
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                onClick={() => toast.success('Booking request sent!')}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const FilterSection = ({ title, children, isExpanded, onToggle }) => (
    <div className="border-b border-white/10 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-white font-medium mb-3 hover:text-blue-400"
      >
        <span>{title}</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isExpanded && children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Thryve</h1>
                <p className="text-blue-200 text-sm">Instructor Marketplace</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Find the Perfect Instructor for Your Studio
          </h2>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Connect with certified fitness professionals who match your studio's needs and culture
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, specialty, or keyword (e.g., 'HIIT coach', 'Prenatal yoga')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-20 py-4 text-lg bg-white/10 backdrop-blur-md border-white/20 border text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent rounded-xl"
            />
            <Button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg"
              onClick={() => toast.success('Searching...')}
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-80">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Type */}
                <FilterSection
                  title="Class Type"
                  isExpanded={expandedFilters.classType}
                  onToggle={() => toggleFilterSection('classType')}
                >
                  <div className="space-y-2">
                    {classTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={filters.classTypes.includes(type)}
                          onCheckedChange={() => toggleFilter('classTypes', type)}
                        />
                        <Label htmlFor={type} className="text-blue-200 text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>

                {/* Location */}
                <FilterSection
                  title="Location"
                  isExpanded={expandedFilters.location}
                  onToggle={() => toggleFilterSection('location')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="virtual"
                        checked={filters.virtual}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, virtual: checked }))}
                      />
                      <Label htmlFor="virtual" className="text-blue-200 text-sm">
                        Virtual Only
                      </Label>
                    </div>
                    <Input
                      placeholder="City or Zip Code"
                      className="bg-white/10 border-white/20 text-white placeholder-blue-300"
                    />
                  </div>
                </FilterSection>

                {/* Price Range */}
                <FilterSection
                  title="Price Range"
                  isExpanded={expandedFilters.priceRange}
                  onToggle={() => toggleFilterSection('priceRange')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-blue-200 text-sm">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
                    </div>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                      max={150}
                      min={20}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </FilterSection>

                {/* Availability */}
                <FilterSection
                  title="Availability"
                  isExpanded={expandedFilters.availability}
                  onToggle={() => toggleFilterSection('availability')}
                >
                  <div className="space-y-2">
                    {availabilityOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={filters.availability.includes(option)}
                          onCheckedChange={() => toggleFilter('availability', option)}
                        />
                        <Label htmlFor={option} className="text-blue-200 text-sm">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>

                {/* Certifications */}
                <FilterSection
                  title="Certifications"
                  isExpanded={expandedFilters.certifications}
                  onToggle={() => toggleFilterSection('certifications')}
                >
                  <div className="space-y-2">
                    {certificationOptions.map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={cert}
                          checked={filters.certifications.includes(cert)}
                          onCheckedChange={() => toggleFilter('certifications', cert)}
                        />
                        <Label htmlFor={cert} className="text-blue-200 text-sm">
                          {cert}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>

                {/* Rating */}
                <FilterSection
                  title="Rating"
                  isExpanded={expandedFilters.rating}
                  onToggle={() => toggleFilterSection('rating')}
                >
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={filters.rating === rating}
                          onCheckedChange={() => setFilters(prev => ({ ...prev, rating: rating }))}
                        />
                        <Label htmlFor={`rating-${rating}`} className="text-blue-200 text-sm flex items-center">
                          {rating}+ 
                          <div className="flex ml-1">
                            {[...Array(rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>

                {/* Languages */}
                <FilterSection
                  title="Languages"
                  isExpanded={expandedFilters.languages}
                  onToggle={() => toggleFilterSection('languages')}
                >
                  <div className="space-y-2">
                    {languageOptions.map((lang) => (
                      <div key={lang} className="flex items-center space-x-2">
                        <Checkbox
                          id={lang}
                          checked={filters.languages.includes(lang)}
                          onCheckedChange={() => toggleFilter('languages', lang)}
                        />
                        <Label htmlFor={lang} className="text-blue-200 text-sm">
                          {lang}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Browse Instructors</h3>
                <p className="text-blue-200">
                  Showing {filteredInstructors.length} instructors
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200 text-sm">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="match">Best Match</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-blue-200 hover:text-white'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-blue-200 hover:text-white'}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructor Grid */}
            {filteredInstructors.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No instructors found</h3>
                  <p className="text-blue-200 mb-6">
                    Try adjusting your filters or search terms to find more instructors.
                  </p>
                  <Button
                    onClick={clearAllFilters}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                {filteredInstructors.map((instructor) => (
                  <InstructorCard
                    key={instructor.id}
                    instructor={instructor}
                    isBookmarked={bookmarkedInstructors.has(instructor.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredInstructors.length > 0 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled
                >
                  Previous
                </Button>
                <div className="flex space-x-2">
                  {[1, 2, 3, '...', 8].map((page, index) => (
                    <Button
                      key={index}
                      variant={page === 1 ? "default" : "outline"}
                      className={page === 1 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                      disabled={page === '...'}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}