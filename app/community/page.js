'use client'

import Link from 'next/link'
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Star, 
  Trophy, 
  Heart, 
  ExternalLink,
  Play,
  BookOpen,
  Zap,
  Target,
  Award,
  Camera,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Community() {
  const socialPlatforms = [
    {
      name: "Discord Community",
      description: "Join our active community for real-time discussions, tips, and networking with fellow fitness professionals",
      icon: MessageSquare,
      members: "2,500+ members",
      link: "https://discord.gg/thryve",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      buttonColor: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
    },
    {
      name: "Facebook Group",
      description: "Connect with studio owners, share success stories, and get advice from experienced professionals",
      icon: Users,
      members: "5,200+ members",
      link: "https://facebook.com/groups/thryveapp",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      buttonColor: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    },
    {
      name: "Follow on X",
      description: "Stay updated with the latest Thryve news, feature announcements, and industry insights",
      icon: Globe,
      members: "8,100+ followers",
      link: "https://x.com/thryveapp",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      buttonColor: "from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
    }
  ]

  const upcomingEvents = [
    {
      title: "Studio Success Masterclass",
      date: "March 15, 2024",
      time: "2:00 PM EST",
      type: "Webinar",
      description: "Learn proven strategies to grow your studio revenue by 40% in 90 days",
      speaker: "Sarah Johnson, Studio Growth Expert",
      registrations: 847
    },
    {
      title: "Tech Talk: AI Features Deep Dive",
      date: "March 22, 2024", 
      time: "3:00 PM EST",
      type: "Product Demo",
      description: "Explore how AI-powered recommendations can boost your class bookings",
      speaker: "Mike Chen, Product Lead",
      registrations: 523
    },
    {
      title: "Community Q&A Session",
      date: "March 29, 2024",
      time: "1:00 PM EST", 
      type: "Live Q&A",
      description: "Open floor for questions, feature requests, and community discussions",
      speaker: "Thryve Team",
      registrations: 312
    }
  ]

  const communityStats = [
    {
      number: "15,000+",
      label: "Community Members",
      icon: Users,
      color: "text-blue-400"
    },
    {
      number: "500+",
      label: "Monthly Events",
      icon: Calendar,
      color: "text-green-400"
    },
    {
      number: "98%",
      label: "Satisfaction Rate",
      icon: Heart,
      color: "text-red-400"
    },
    {
      number: "24/7",
      label: "Peer Support",
      icon: MessageSquare,
      color: "text-purple-400"
    }
  ]

  const communityHighlights = [
    {
      title: "Success Stories",
      description: "Read inspiring stories from studio owners who've grown their business with Thryve",
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20"
    },
    {
      title: "Best Practices",
      description: "Learn from community experts about marketing, retention, and operations",
      icon: Target,
      color: "text-green-400", 
      bgColor: "bg-green-500/20"
    },
    {
      title: "Feature Requests",
      description: "Vote on upcoming features and help shape the future of the platform",
      icon: Zap,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Networking",
      description: "Connect with like-minded professionals and build lasting partnerships",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    }
  ]

  const featuredMembers = [
    {
      name: "Jennifer Martinez",
      role: "Studio Owner, ZenFlow Yoga",
      achievement: "Grew membership by 300% using Thryve",
      avatar: "JM",
      quote: "The community support has been incredible. I've learned so much from other studio owners here!"
    },
    {
      name: "David Thompson", 
      role: "Fitness Instructor",
      achievement: "Top-rated instructor, 4.9/5 stars",
      avatar: "DT",
      quote: "Being part of this community has helped me improve my teaching and connect with amazing people."
    },
    {
      name: "Maria Rodriguez",
      role: "Wellness Coach",
      achievement: "Community Helper of the Month",
      avatar: "MR",
      quote: "I love helping newcomers get started. This community is all about lifting each other up!"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Thryve Community</h1>
            </div>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
              Join our thriving community of fitness professionals, studio owners, and wellness seekers. 
              Connect, learn, and grow together in the future of fitness.
            </p>
            
            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {communityStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 bg-white/10 rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.number}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Social Platforms */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Connect With Us</h2>
            <p className="text-blue-200 text-lg">Join our community on your favorite platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {socialPlatforms.map((platform, index) => {
              const Icon = platform.icon
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 ${platform.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`h-8 w-8 ${platform.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{platform.name}</h3>
                    <p className="text-blue-200 text-sm mb-4">{platform.description}</p>
                    <Badge variant="outline" className="text-white border-white/20 mb-6">
                      {platform.members}
                    </Badge>
                    <div>
                      <Button 
                        className={`w-full bg-gradient-to-r ${platform.buttonColor} text-white`}
                        onClick={() => window.open(platform.link, '_blank')}
                      >
                        Join Community
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Events & Webinars</h2>
            <p className="text-blue-200 text-lg">Join our monthly live training sessions, product demos, and success stories</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
                      {event.type}
                    </Badge>
                    <div className="flex items-center text-blue-300 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {event.registrations}
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                  <CardDescription className="text-blue-200">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-white text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center text-blue-200 text-sm">
                      <Star className="h-4 w-4 mr-2" />
                      {event.speaker}
                    </div>
                    <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                      Register Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Highlights */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Community Highlights</h2>
            <p className="text-blue-200 text-lg">Discover what makes our community special</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityHighlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${highlight.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${highlight.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{highlight.title}</h3>
                    <p className="text-blue-200 text-sm">{highlight.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Featured Members */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Featured Community Members</h2>
            <p className="text-blue-200 text-lg">Meet some of our amazing community stars</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredMembers.map((member, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                      <p className="text-blue-300 text-sm mb-2">{member.role}</p>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50 mb-3">
                        <Award className="h-3 w-3 mr-1" />
                        {member.achievement}
                      </Badge>
                      <blockquote className="text-blue-200 text-sm italic">
                        "{member.quote}"
                      </blockquote>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Join CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 max-w-3xl mx-auto">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Join Our Community?</h2>
              <p className="text-blue-200 text-lg mb-8">
                Be part of a supportive network that's transforming the fitness industry together
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  onClick={() => window.open('https://discord.gg/thryve', '_blank')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Discord
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  onClick={() => window.open('https://facebook.com/groups/thryveapp', '_blank')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Join Facebook Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="text-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Thryve Home
          </Link>
        </div>
      </div>
    </div>
  )
}