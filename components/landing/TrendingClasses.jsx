'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Users, Star } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

// ✅ EXTRACTED: Trending classes section
const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1593810451056-0acc1fad48c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1598596583430-c81c94b52dad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85"
]

const TRENDING_CLASSES = [
  {
    id: 1,
    title: "Power Vinyasa Flow",
    instructor: "Maya Chen",
    studio: "Zen Flow Studio",
    time: "7:00 AM",
    date: "Today",
    price: "$28",
    image: LIFESTYLE_IMAGES[0],
    type: "Yoga",
    capacity: 20,
    booked: 15,
    duration: 60,
    location: "Downtown",
    description: "An energizing flow class that builds strength and flexibility",
    rating: "4.9"
  },
  {
    id: 2,
    title: "HIIT Bootcamp",
    instructor: "Marcus Williams",
    studio: "Strength Labs",
    time: "6:30 PM",
    date: "Today",
    price: "$35",
    image: LIFESTYLE_IMAGES[1],
    type: "HIIT",
    capacity: 18,
    booked: 18,
    duration: 45,
    location: "Midtown",
    description: "High-intensity interval training for maximum calorie burn",
    rating: "4.8"
  },
  {
    id: 3,
    title: "Pilates Reformer",
    instructor: "Sarah Johnson",
    studio: "Core Studio",
    time: "12:00 PM",
    date: "Tomorrow",
    price: "$42",
    image: LIFESTYLE_IMAGES[1],
    type: "Pilates",
    capacity: 15,
    booked: 8,
    duration: 60,
    location: "Uptown",
    description: "Precision movement on the reformer for core strength",
    rating: "4.9"
  },
  {
    id: 4,
    title: "Boxing Fundamentals",
    instructor: "Diego Rivera",
    studio: "Fight Club NYC",
    time: "8:00 PM",
    date: "Tomorrow",
    price: "$30",
    image: LIFESTYLE_IMAGES[0],
    type: "Boxing",
    capacity: 16,
    booked: 10,
    duration: 50,
    location: "Brooklyn",
    description: "Learn proper boxing technique in a supportive environment",
    rating: "4.7"
  }
]

export default function TrendingClasses({ onBookClass, onSignInRequired }) {
  const { user } = useAuth()

  const handleBookClass = (classData) => {
    if (!user) {
      onSignInRequired()
      return
    }
    onBookClass(classData)
  }

  return (
    <section className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-18-13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-36-26c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100/50 mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold">
              🔥 Trending Classes
            </span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
            Book Your Next{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Workout
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Discover amazing classes from top-rated studios in your area. From yoga to HIIT, find your perfect workout today.
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRENDING_CLASSES.map((classData) => (
            <Card key={classData.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <div className="relative">
                <img 
                  src={classData.image} 
                  alt={classData.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-slate-800 hover:bg-white">
                    {classData.type}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-slate-800">{classData.rating}</span>
                  </div>
                </div>
                {classData.booked >= classData.capacity && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive" className="bg-red-600">
                      Fully Booked
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {classData.title}
                    </h3>
                    <p className="text-slate-600 font-medium">{classData.instructor}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{classData.studio} • {classData.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{classData.date} • {classData.time} • {classData.duration}min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{classData.booked}/{classData.capacity} spots</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {classData.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-2xl font-bold text-slate-900">
                      {classData.price}
                    </div>
                    <Button 
                      onClick={() => handleBookClass(classData)}
                      disabled={classData.booked >= classData.capacity}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {classData.booked >= classData.capacity ? 'Full' : 'Book Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="text-center mt-16">
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-12 py-4 rounded-2xl text-lg font-semibold"
          >
            View All Classes
          </Button>
        </div>
      </div>
    </section>
  )
}