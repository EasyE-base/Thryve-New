'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Zap, MapPin, Star, Clock, Users, Calendar,
  Search, Filter, ShoppingCart, Heart,
  Building2, Award, Target, TrendingUp
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'

// ✅ CUSTOMER X PASS DASHBOARD
export default function CustomerXPass() {
  const { xPassCredits, bookClass } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // ✅ MOCK X PASS STUDIOS DATA
  const xPassStudios = [
    {
      id: 1,
      name: 'Zen Wellness Studio',
      area: 'Downtown',
      rating: 4.9,
      reviews: 324,
      distance: '0.5 miles',
      image: null,
      specialties: ['Yoga', 'Meditation', 'Pilates'],
      introOffer: '50% off first visit',
      classes: [
        { name: 'Morning Flow', time: '8:00 AM', date: 'Tomorrow', instructor: 'Sarah M.', spots: 3 },
        { name: 'Power Yoga', time: '6:00 PM', date: 'Today', instructor: 'David K.', spots: 1 },
        { name: 'Restorative', time: '7:30 PM', date: 'Jan 22', instructor: 'Lisa W.', spots: 8 }
      ]
    },
    {
      id: 2,
      name: 'FitZone CrossFit',
      area: 'Westside',
      rating: 4.7,
      reviews: 189,
      distance: '1.2 miles',
      image: null,
      specialties: ['CrossFit', 'HIIT', 'Strength'],
      introOffer: 'Free trial class',
      classes: [
        { name: 'WOD Basics', time: '6:00 AM', date: 'Tomorrow', instructor: 'Mike C.', spots: 5 },
        { name: 'HIIT Burn', time: '5:30 PM', date: 'Today', instructor: 'Emma R.', spots: 2 },
        { name: 'Olympic Lifting', time: '7:00 PM', date: 'Jan 23', instructor: 'Tom H.', spots: 4 }
      ]
    },
    {
      id: 3,
      name: 'Dance Fusion Studio',
      area: 'Midtown',
      rating: 4.8,
      reviews: 267,
      distance: '0.8 miles',
      image: null,
      specialties: ['Dance', 'Cardio', 'Hip Hop'],
      introOffer: '25% off first month',
      classes: [
        { name: 'Hip Hop Cardio', time: '7:00 PM', date: 'Today', instructor: 'Alex J.', spots: 6 },
        { name: 'Latin Dance', time: '8:00 PM', date: 'Tomorrow', instructor: 'Maria S.', spots: 4 },
        { name: 'Contemporary', time: '6:30 PM', date: 'Jan 24', instructor: 'Jordan L.', spots: 7 }
      ]
    }
  ]

  // ✅ X PASS PACKAGES
  const xPassPackages = [
    { credits: 5, price: 75, perClass: 15, popular: false },
    { credits: 10, price: 140, perClass: 14, popular: true },
    { credits: 20, price: 260, perClass: 13, popular: false }
  ]

  // ✅ PURCHASE X PASS CREDITS
  const handlePurchase = async (packageData) => {
    try {
      const response = await fetch('/api/xpass/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (response.ok) {
        toast.success(`${packageData.credits} X Pass credits added to your account!`)
        setShowPurchaseModal(false)
      } else {
        throw new Error('Failed to purchase X Pass credits')
      }
    } catch (error) {
      toast.error('Failed to purchase credits. Please try again.')
    }
  }

  // ✅ BOOK X PASS CLASS
  const handleBookClass = async (studioId, classData) => {
    if (xPassCredits < 1) {
      toast.error('You need X Pass credits to book this class')
      setShowPurchaseModal(true)
      return
    }

    try {
      await bookClass(classData.id, 'xpass')
      toast.success('Class booked with X Pass!')
    } catch (error) {
      toast.error('Failed to book class')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Zap className="h-7 w-7 text-orange-500" />
            <span>X Pass Studios</span>
          </h1>
          <p className="text-gray-600">Explore classes across different studios</p>
        </div>
        
        <Button 
          onClick={() => setShowPurchaseModal(true)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy Credits
        </Button>
      </div>

      {/* Credits Status */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {xPassCredits || 5} Credits Available
                </h3>
                <p className="text-gray-600">
                  Use at {xPassStudios.length} partner studios • Expires Mar 15, 2024
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">This month</div>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-gray-600">classes booked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search studios or classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="downtown">Downtown</SelectItem>
                <SelectItem value="westside">Westside</SelectItem>
                <SelectItem value="midtown">Midtown</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
                <SelectItem value="dance">Dance</SelectItem>
                <SelectItem value="pilates">Pilates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Studios Grid */}
      <div className="space-y-6">
        {xPassStudios.map((studio) => (
          <Card key={studio.id} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Studio Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold">{studio.name}</h3>
                        <Badge className="bg-orange-100 text-orange-700">
                          <Zap className="h-3 w-3 mr-1" />
                          X Pass
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{studio.area} • {studio.distance}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{studio.rating} ({studio.reviews} reviews)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {studio.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      {studio.introOffer && (
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-700">
                            <Award className="h-3 w-3 mr-1" />
                            {studio.introOffer}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>

                {/* Available Classes */}
                <div>
                  <h4 className="font-semibold mb-3">Available Classes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {studio.classes.map((classData, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{classData.name}</h5>
                            <Badge 
                              variant={classData.spots < 3 ? 'destructive' : 'secondary'}
                              className={`text-xs ${
                                classData.spots < 3 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {classData.spots} spots
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{classData.date}</span>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>{classData.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{classData.instructor}</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleBookClass(studio.id, classData)}
                            disabled={xPassCredits < 1}
                          >
                            {xPassCredits < 1 ? 'No Credits' : 'Book with X Pass'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Purchase Credits Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span>Purchase X Pass Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {xPassPackages.map((pkg) => (
                  <div
                    key={pkg.credits}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      pkg.popular 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500">
                        Most Popular
                      </Badge>
                    )}
                    
                    <div className="text-center space-y-3">
                      <div className="text-3xl font-bold">{pkg.credits}</div>
                      <div className="text-sm text-gray-600">Credits</div>
                      
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          ${pkg.price}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${pkg.perClass} per class
                        </div>
                      </div>
                      
                      <Button 
                        className={`w-full ${
                          pkg.popular 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : ''
                        }`}
                        onClick={() => handlePurchase(pkg)}
                      >
                        Purchase
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">X Pass Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Access to 12+ partner studios</li>
                  <li>• Credits never expire</li>
                  <li>• Book classes up to 30 days in advance</li>
                  <li>• Cancel up to 2 hours before class</li>
                  <li>• Special member pricing and offers</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}