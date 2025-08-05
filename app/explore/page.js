'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Star, Clock, Users, Bot
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'

export default function ExplorePage() {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('Catting')
  const [loading, setLoading] = useState(true)

  // Mock data matching the image
  const TRENDING_CLASSES = [
    {
      id: 1,
      title: "HIIT",
      studio: "Energy Gym", 
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop"
    },
    {
      id: 2,
      title: "Vinyasa Yoga",
      studio: "Mindful Movements",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb07659d?w=500&h=300&fit=crop"
    },
    {
      id: 3,
      title: "Surfing", 
      studio: "Malibu Surf Shack",
      image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&h=300&fit=crop"
    },
    {
      id: 4,
      title: "Strength Training",
      studio: "Forge Fitness",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop"
    }
  ]

  const RECOMMENDED_CLASSES = [
    {
      id: 5,
      title: "Power Yoga",
      studio: "Zen Den",
      rating: 4.8,
      location: "Central Park",
      time: "8:00 AM",
      image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=500&h=300&fit=crop"
    },
    {
      id: 6,
      title: "Cycling",
      studio: "Revolution Cycles", 
      rating: 4.6,
      location: "Fitness Row",
      time: "6:30 PM",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop"
    }
  ]

  const PEOPLE_ALSO_BOOKED = [
    {
      id: 7,
      title: "Dance Cardio",
      studio: "Movement Lab",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=300&fit=crop"
    },
    {
      id: 8,
      title: "Pilates",
      studio: "Core Studios",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=300&fit=crop"
    }
  ]

  const mainFilters = ['Catting', 'Virtual', 'Recovery']
  const typeFilters = ['Yoga', 'Strength', 'Dance', 'Mobility', 'Recovery', 'Beginner', 'Morning', 'Outdoor']

  useEffect(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const handleBookNow = (classItem) => {
    if (!user) {
      toast.info("Sign up to book this class!")
      return
    }
    toast.success(`Booking ${classItem.title}! 🎉`)
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Mobile-First Header - Exact Match to Image */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-black">Explore</h1>
          <div className="text-right">
            <div className="text-sm text-gray-500">Explore All</div>
          </div>
        </div>
        
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>Classes near Vineland, NJ</span>
        </div>

        {/* Main Filter Tabs - Exact Match to Image */}
        <div className="flex space-x-2 mb-4">
          {mainFilters.map(filter => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm",
                activeFilter === filter 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-600 border-gray-300'
              )}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Category Filter Pills - Horizontal Scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {typeFilters.map(type => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-1 text-sm whitespace-nowrap bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content - Mobile First Layout Exact Match to Image */}
      <div className="px-4">
        {/* Trending Classes Section - 2x2 Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Trending classes</h2>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-48"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {TRENDING_CLASSES.map(classItem => (
                <Card key={classItem.id} className="overflow-hidden rounded-2xl shadow-sm">
                  <div className="relative">
                    <img 
                      src={classItem.image} 
                      alt={classItem.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="text-lg font-bold">{classItem.title}</div>
                      <div className="text-sm opacity-90">{classItem.studio}</div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleBookNow(classItem)}
                      className="absolute bottom-3 right-3 bg-white text-black hover:bg-gray-100 rounded-lg px-4 py-1 text-sm"
                    >
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recommended Section - Horizontal Cards */}
        <section className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-black" />
            <h2 className="text-xl font-bold text-black">Recommended for you</h2>
          </div>
          
          <div className="space-y-4">
            {RECOMMENDED_CLASSES.map(classItem => (
              <Card key={classItem.id} className="overflow-hidden rounded-2xl shadow-sm">
                <div className="flex">
                  <img 
                    src={classItem.image} 
                    alt={classItem.title}
                    className="w-24 h-24 object-cover rounded-l-2xl"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-black">{classItem.title}</h3>
                        <p className="text-sm text-gray-600">{classItem.studio}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm ml-1">{classItem.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {classItem.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {classItem.time}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleBookNow(classItem)}
                        className="bg-black text-white hover:bg-gray-800 rounded-lg px-4 py-1 text-sm"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* People Also Booked Section - 2x2 Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4 uppercase tracking-wide">PEOPLE ALSO BOOKED</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {PEOPLE_ALSO_BOOKED.map(classItem => (
              <Card key={classItem.id} className="overflow-hidden rounded-2xl shadow-sm">
                <div className="relative">
                  <img 
                    src={classItem.image} 
                    alt={classItem.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-lg font-bold">{classItem.title}</div>
                    <div className="text-sm opacity-90">{classItem.studio}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile Footer */}
      <footer className="bg-gray-900 text-white px-4 py-8 mt-12">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-2">Thryve</h3>
            <div className="grid grid-cols-4 gap-4 text-sm text-gray-400">
              <div>
                <Link href="/trending" className="block hover:text-white">Trending Classes</Link>
                <Link href="/studios" className="block hover:text-white mt-1">Nearby Studios</Link>
              </div>
              <div>
                <Link href="/app" className="block hover:text-white">App</Link>
                <Link href="/community" className="block hover:text-white mt-1">Community</Link>
              </div>
              <div>
                <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
                <Link href="/support" className="block hover:text-white mt-1">Support</Link>
              </div>
              <div>
                <Link href="/service" className="block hover:text-white">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}