'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  Heart,
  MessageCircle,
  Play,
  CheckCircle,
  Globe,
  Dumbbell,
  Users,
  DollarSign,
  Sparkles,
  BookOpen,
  Send,
  Phone,
  Video,
  Shield,
  ThumbsUp,
  Filter,
  ChevronDown,
  PlayCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Calendar as CalendarIcon,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format, addDays, startOfWeek, endOfWeek, isToday, isTomorrow } from 'date-fns'

// Sample instructor data - In real app, this would come from API
const instructorData = {
  1: {
    id: 1,
    name: 'Sarah Johnson',
    tagline: 'Yoga with Mindfulness',
    specialties: ['Yoga', 'Vinyasa', 'Meditation', 'Prenatal Yoga'],
    location: 'New York, NY',
    virtual: true,
    rating: 4.9,
    reviewCount: 127,
    pricePerClass: 85,
    pricePerHour: 120,
    experience: '5+ years',
    languages: ['English', 'Spanish'],
    certifications: ['RYT-200', 'RYT-500', 'NASM', 'CPR'],
    verified: true,
    responseTime: '~2 hours',
    responseRate: 98,
    totalStudents: 450,
    repeatRate: 85,
    bio: 'Certified yoga instructor with 5+ years of experience helping students find balance and strength. My classes focus on mindful movement, breathwork, and creating a safe space for all practitioners regardless of experience level.',
    fullBio: 'I discovered yoga during a stressful period in my corporate career and it completely transformed my life. After 200+ hours of training at Om Yoga Center and additional certifications in prenatal yoga and meditation, I left my corporate job to share this transformative practice with others.\n\nMy teaching style emphasizes alignment, breath awareness, and mindful movement. I believe yoga should be accessible to everyone, regardless of body type, age, or experience level. In my classes, you\'ll find modifications for every pose and a welcoming environment where you can explore your practice safely.\n\nWhen I\'m not teaching, you can find me hiking in the mountains, reading philosophy books, or experimenting with new healthy recipes in my kitchen.',
    videoIntro: 'https://example.com/intro-video.mp4',
    heroImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    availability: {
      monday: ['9:00 AM', '6:00 PM'],
      tuesday: ['9:00 AM', '12:00 PM', '6:00 PM'],
      wednesday: ['9:00 AM', '6:00 PM'],
      thursday: ['9:00 AM', '12:00 PM', '6:00 PM'],
      friday: ['9:00 AM', '6:00 PM'],
      saturday: ['10:00 AM', '2:00 PM'],
      sunday: ['10:00 AM']
    },
    upcomingClasses: [
      {
        id: 'c1',
        title: 'Morning Vinyasa Flow',
        date: new Date(2024, 5, 17, 9, 0),
        duration: 60,
        spots: 3,
        price: 85,
        level: 'All Levels',
        type: 'Group Class'
      },
      {
        id: 'c2',
        title: 'Prenatal Yoga',
        date: new Date(2024, 5, 17, 18, 0),
        duration: 45,
        spots: 5,
        price: 85,
        level: 'All Levels',
        type: 'Specialized'
      },
      {
        id: 'c3',
        title: 'Meditation & Breathwork',
        date: new Date(2024, 5, 18, 19, 0),
        duration: 30,
        spots: 8,
        price: 60,
        level: 'Beginner',
        type: 'Workshop'
      }
    ],
    reviews: [
      {
        id: 1,
        name: 'Emma Thompson',
        rating: 5,
        date: '2 days ago',
        comment: 'Sarah is an incredible instructor! Her morning vinyasa classes are the perfect way to start the day. She creates such a welcoming atmosphere and her cues are clear and helpful.',
        classType: 'Vinyasa Flow',
        helpful: 12,
        verified: true
      },
      {
        id: 2,
        name: 'Michael Chen',
        rating: 5,
        date: '1 week ago',
        comment: 'I\'ve been taking classes with Sarah for 6 months now and my flexibility and strength have improved dramatically. She\'s patient, knowledgeable, and always provides modifications.',
        classType: 'Hatha Yoga',
        helpful: 8,
        verified: true
      },
      {
        id: 3,
        name: 'Lisa Rodriguez',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Sarah\'s prenatal yoga class was exactly what I needed during my pregnancy. She\'s so knowledgeable about modifications and made me feel completely safe.',
        classType: 'Prenatal Yoga',
        helpful: 15,
        verified: true
      },
      {
        id: 4,
        name: 'James Wilson',
        rating: 4,
        date: '3 weeks ago',
        comment: 'Great instructor with excellent technique. The only reason I didn\'t give 5 stars is because the class was quite full and it was hard to get individual attention.',
        classType: 'Vinyasa Flow',
        helpful: 5,
        verified: true
      }
    ],
    socialProof: {
      totalClassesTaught: 890,
      studentsTransformed: 450,
      averageImprovement: '40% flexibility increase',
      successStories: 23
    },
    packages: [
      {
        id: 'p1',
        name: 'Single Class',
        price: 85,
        description: 'Drop-in rate for any class',
        popular: false
      },
      {
        id: 'p2',
        name: '5-Class Package',
        price: 400,
        originalPrice: 425,
        description: 'Best value for regular practice',
        popular: true
      },
      {
        id: 'p3',
        name: 'Private Session',
        price: 120,
        description: 'One-on-one personalized instruction',
        popular: false
      }
    ]
  },
  // Add more instructor data as needed
  2: {
    id: 2,
    name: 'Michael Rodriguez',
    tagline: 'HIIT with Heart',
    specialties: ['HIIT', 'Strength', 'Cardio', 'Functional Training'],
    location: 'Virtual',
    virtual: true,
    rating: 4.7,
    reviewCount: 89,
    pricePerClass: 75,
    pricePerHour: 100,
    experience: '3+ years',
    languages: ['English'],
    certifications: ['ACSM', 'NASM'],
    verified: true,
    responseTime: '~1 hour',
    responseRate: 95,
    totalStudents: 280,
    repeatRate: 78,
    bio: 'High-energy HIIT specialist focused on functional fitness and sustainable results.',
    fullBio: 'As a former athlete, I understand the importance of functional fitness and efficient workouts. My HIIT classes are designed to maximize your time while delivering incredible results.',
    videoIntro: 'https://example.com/intro-video-2.mp4',
    heroImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    availability: {
      monday: ['6:00 AM', '6:00 PM'],
      tuesday: ['6:00 AM', '6:00 PM'],
      wednesday: ['6:00 AM', '6:00 PM'],
      thursday: ['6:00 AM', '6:00 PM'],
      friday: ['6:00 AM', '6:00 PM'],
      saturday: ['8:00 AM', '4:00 PM'],
      sunday: ['8:00 AM']
    },
    upcomingClasses: [
      {
        id: 'c4',
        title: 'HIIT Bootcamp',
        date: new Date(2024, 5, 17, 18, 0),
        duration: 45,
        spots: 2,
        price: 75,
        level: 'Intermediate',
        type: 'Group Class'
      }
    ],
    reviews: [
      {
        id: 5,
        name: 'Sarah Kim',
        rating: 5,
        date: '3 days ago',
        comment: 'Michael\'s HIIT classes are intense but so effective! I\'ve seen amazing results in just 2 months.',
        classType: 'HIIT Bootcamp',
        helpful: 7,
        verified: true
      }
    ],
    socialProof: {
      totalClassesTaught: 520,
      studentsTransformed: 280,
      averageImprovement: '25% strength increase',
      successStories: 15
    },
    packages: [
      {
        id: 'p4',
        name: 'Single Class',
        price: 75,
        description: 'Drop-in rate for any class',
        popular: false
      },
      {
        id: 'p5',
        name: '8-Class Package',
        price: 560,
        originalPrice: 600,
        description: 'Perfect for consistent training',
        popular: true
      }
    ]
  }
}

export default function InstructorProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [instructor, setInstructor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const instructorProfile = instructorData[id]
      if (instructorProfile) {
        setInstructor(instructorProfile)
        setSelectedPackage(instructorProfile.packages.find(p => p.popular) || instructorProfile.packages[0])
      }
      setLoading(false)
    }, 1000)
  }, [id])

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
  }

  const handleBookNow = () => {
    if (!selectedPackage) {
      toast.error('Please select a package first')
      return
    }
    setShowBookingModal(true)
  }

  const handleMessage = () => {
    toast.info('Messaging feature coming soon!')
  }

  const handleShare = () => {
    toast.success('Profile link copied to clipboard!')
  }

  const filteredReviews = instructor?.reviews?.filter(review => {
    if (reviewFilter === 'all') return true
    if (reviewFilter === '5star') return review.rating === 5
    if (reviewFilter === '4star') return review.rating === 4
    return true
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-light">Loading Profile...</p>
        </div>
      </div>
    )
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Instructor Not Found</h1>
          <p className="text-blue-200 mb-6">The instructor profile you're looking for doesn't exist.</p>
          <Link href="/marketplace">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/marketplace">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBookmark}
                className="text-white hover:text-blue-400 hover:bg-white/10"
              >
                <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-current text-red-400' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                onClick={handleShare}
                className="text-white hover:text-blue-400 hover:bg-white/10"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 ring-4 ring-blue-400/50">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl">
                      {instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {instructor.verified && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{instructor.name}</h1>
                  <p className="text-xl text-blue-200 mb-4">{instructor.tagline}</p>
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-white text-lg ml-2 font-semibold">{instructor.rating}</span>
                      <span className="text-blue-200 ml-1">({instructor.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center text-blue-200">
                      <MapPin className="h-4 w-4 mr-1" />
                      {instructor.location}
                    </div>
                    {instructor.virtual && (
                      <div className="flex items-center text-blue-200">
                        <Video className="h-4 w-4 mr-1" />
                        Virtual Available
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {instructor.specialties.map((specialty, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-200">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{instructor.experience}</div>
                      <div className="text-sm text-blue-200">Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{instructor.totalStudents}</div>
                      <div className="text-sm text-blue-200">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{instructor.responseRate}%</div>
                      <div className="text-sm text-blue-200">Response Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{instructor.responseTime}</div>
                      <div className="text-sm text-blue-200">Response Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Booking Panel */}
            <div className="w-full lg:w-96">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white">Book a Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {instructor.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPackage?.id === pkg.id
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white">{pkg.name}</h4>
                            <p className="text-blue-200 text-sm">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">${pkg.price}</div>
                            {pkg.originalPrice && (
                              <div className="text-sm text-blue-300 line-through">${pkg.originalPrice}</div>
                            )}
                          </div>
                        </div>
                        {pkg.popular && (
                          <Badge className="bg-green-500/20 text-green-200 mt-2">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleBookNow}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      Book Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleMessage}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-blue-200 text-sm">
                      <Shield className="h-4 w-4 inline mr-1" />
                      Protected by Thryve Guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-md">
                <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="classes" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Classes
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="about" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  About
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Video Introduction */}
                {instructor.videoIntro && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Meet {instructor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => toast.info('Video player coming soon!')}
                        >
                          <PlayCircle className="h-8 w-8 mr-2" />
                          Watch Introduction Video
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* About */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">About {instructor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-200 leading-relaxed">{instructor.bio}</p>
                  </CardContent>
                </Card>

                {/* Certifications */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {instructor.certifications.map((cert, index) => (
                        <div key={index} className="text-center p-4 bg-white/5 rounded-lg">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Award className="h-6 w-6 text-blue-400" />
                          </div>
                          <p className="text-white font-medium">{cert}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Proof */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Impact & Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{instructor.socialProof.totalClassesTaught}</div>
                        <div className="text-blue-200">Classes Taught</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{instructor.socialProof.studentsTransformed}</div>
                        <div className="text-blue-200">Students Helped</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{instructor.socialProof.averageImprovement}</div>
                        <div className="text-blue-200">Avg. Improvement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{instructor.socialProof.successStories}</div>
                        <div className="text-blue-200">Success Stories</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Upcoming Classes</CardTitle>
                    <CardDescription className="text-blue-200">
                      Available spots in {instructor.name}'s upcoming classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {instructor.upcomingClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{classItem.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-blue-200 mt-1">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {format(classItem.date, 'MMM dd, h:mm a')}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {classItem.duration}min
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {classItem.spots} spots left
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className="bg-blue-500/20 text-blue-200">{classItem.level}</Badge>
                              <Badge className="bg-green-500/20 text-green-200">{classItem.type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">${classItem.price}</div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white mt-2"
                              onClick={() => toast.success('Booking class...')}
                            >
                              Book Class
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Availability Calendar */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Weekly Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      {Object.entries(instructor.availability).map(([day, times]) => (
                        <div key={day} className="text-center">
                          <h4 className="font-semibold text-white mb-2 capitalize">{day}</h4>
                          <div className="space-y-1">
                            {times.map((time, index) => (
                              <div key={index} className="text-sm text-blue-200 bg-white/5 rounded px-2 py-1">
                                {time}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">Reviews ({instructor.reviewCount})</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-blue-200" />
                        <select
                          value={reviewFilter}
                          onChange={(e) => setReviewFilter(e.target.value)}
                          className="bg-white/10 border-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                          <option value="all">All Reviews</option>
                          <option value="5star">5 Stars</option>
                          <option value="4star">4 Stars</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {filteredReviews.map((review) => (
                        <div key={review.id} className="border-b border-white/10 pb-6 last:border-b-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                  {review.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-white">{review.name}</span>
                                  {review.verified && (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-blue-200">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span>{review.date}</span>
                                  <Badge className="bg-blue-500/20 text-blue-200">{review.classType}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-blue-200 leading-relaxed mb-3">{review.comment}</p>
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-200 hover:text-white"
                              onClick={() => toast.info('Helpful vote coming soon!')}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Helpful ({review.helpful})
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">About {instructor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      {instructor.fullBio.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-blue-200 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {instructor.languages.map((language, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-200">
                          <Globe className="h-4 w-4 mr-1" />
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}