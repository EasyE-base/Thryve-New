'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, Sparkles, Search, BarChart3, Target, 
  TrendingUp, Users, Calendar, Zap, Star,
  Lightbulb, Heart, Trophy, BookOpen
} from 'lucide-react'
import AIClassRecommendations from '@/components/AIClassRecommendations'
import AISmartSearch from '@/components/AISmartSearch'
import { toast } from 'sonner'

export default function AIDashboard() {
  const { user, userRole } = useAuth()
  const [activeTab, setActiveTab] = useState('recommendations')

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <Brain className="h-20 w-20 text-blue-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">AI-Powered Fitness Platform</h1>
            <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
              Experience the future of fitness with personalized AI recommendations, smart search, and intelligent insights.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started with AI
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">AI Fitness Assistant</h1>
          </div>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto">
            Your personal AI-powered fitness companion that learns your preferences and helps you achieve your goals faster.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/20">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              Personalized
            </Badge>
            <Badge className="bg-green-500/20 text-green-200 border border-green-400/20">
              <Zap className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </div>

        {/* AI Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 border border-purple-400/20 backdrop-blur-sm hover:from-purple-800/40 hover:to-purple-600/40 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Smart Recommendations</h3>
              <p className="text-purple-200 text-sm leading-relaxed">
                AI analyzes your preferences, goals, and workout history to suggest perfect classes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 border border-blue-400/20 backdrop-blur-sm hover:from-blue-800/40 hover:to-blue-600/40 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Natural Language Search</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Search using everyday language like "morning yoga for stress relief"
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-green-700/30 border border-green-400/20 backdrop-blur-sm hover:from-green-800/40 hover:to-green-600/40 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Predictive Insights</h3>
              <p className="text-green-200 text-sm leading-relaxed">
                Get AI-powered insights about fitness trends and optimal workout timing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg mr-4">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Learning Progress</h3>
                  <p className="text-blue-200 text-sm">AI is continuously learning your preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-blue-200 text-xs">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-blue-200 text-xs">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">∞</div>
                  <div className="text-blue-200 text-xs">Learning</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main AI Interface */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-white/10 p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                  <TabsTrigger 
                    value="recommendations" 
                    className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Recommendations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="search"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Smart Search
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="recommendations" className="mt-0 p-6">
                <AIClassRecommendations />
              </TabsContent>
              
              <TabsContent value="search" className="mt-0 p-6">
                <AISmartSearch />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Tips and Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-700/20 border border-orange-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-5 w-5 text-orange-400 mr-3" />
                <h3 className="text-white font-semibold">AI Tips for Better Fitness</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-orange-200">Complete your profile to get more accurate recommendations</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-orange-200">Rate classes to help AI learn your preferences faster</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-orange-200">Use specific terms in search for better AI understanding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-900/20 to-teal-700/20 border border-teal-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Trophy className="h-5 w-5 text-teal-400 mr-3" />
                <h3 className="text-white font-semibold">Your AI Progress</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-teal-200 text-sm">Profile Completeness</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-teal-900/30 rounded-full mr-2">
                      <div className="w-16 h-2 bg-teal-400 rounded-full"></div>
                    </div>
                    <span className="text-teal-200 text-sm">80%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-teal-200 text-sm">AI Learning</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-teal-900/30 rounded-full mr-2">
                      <div className="w-12 h-2 bg-teal-400 rounded-full"></div>
                    </div>
                    <span className="text-teal-200 text-sm">60%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-teal-200 text-sm">Recommendations Accuracy</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-teal-900/30 rounded-full mr-2">
                      <div className="w-19 h-2 bg-teal-400 rounded-full"></div>
                    </div>
                    <span className="text-teal-200 text-sm">95%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Future AI Features Preview */}
        <Card className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-indigo-400 mr-3" />
              <h3 className="text-white font-semibold">Coming Soon: Advanced AI Features</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">AI Health Coach</h4>
                  <p className="text-indigo-200">Personalized workout plans</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Smart Scheduling</h4>
                  <p className="text-indigo-200">Optimal workout timing</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Community AI</h4>
                  <p className="text-indigo-200">Find workout buddies</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/20 rounded-full">
            <Brain className="h-5 w-5 text-purple-400 mr-3" />
            <span className="text-white font-medium">
              Powered by OpenAI GPT-4 and advanced machine learning
            </span>
            <Sparkles className="h-5 w-5 text-blue-400 ml-3" />
          </div>
          <p className="text-blue-300 text-sm mt-4">
            Your AI assistant learns and improves with every interaction
          </p>
        </div>
      </div>
    </div>
  )
}