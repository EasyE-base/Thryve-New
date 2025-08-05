'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, Target, DollarSign, Users, Calendar } from 'lucide-react'

// ✅ EXTRACTED: AI Analysis step with real-time insights
export default function AIAnalysisStep({ 
  studioData, 
  analysis, 
  loading, 
  onAnalysisComplete 
}) {
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // ✅ EFFECT: Simulate AI analysis progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [loading])

  // ✅ EFFECT: Complete analysis when done
  useEffect(() => {
    if (analysis) {
      setAnalysisProgress(100)
    }
  }, [analysis])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 animate-pulse">
            <Sparkles className="h-12 w-12 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">AI is analyzing your studio...</h3>
          <p className="text-white/70">This may take a few moments</p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-white/60 text-sm mt-2">{Math.round(analysisProgress)}% complete</p>
        </div>

        {/* Analysis steps */}
        <div className="text-left max-w-md mx-auto space-y-3">
          <div className="flex items-center text-white/70">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
            Analyzing studio type and location
          </div>
          <div className="flex items-center text-white/70">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
            Evaluating target audience fit
          </div>
          <div className="flex items-center text-white/70">
            <div className={`w-2 h-2 rounded-full mr-3 ${analysisProgress > 50 ? 'bg-green-400' : 'bg-white/30'}`} />
            Generating recommendations
          </div>
          <div className="flex items-center text-white/70">
            <div className={`w-2 h-2 rounded-full mr-3 ${analysisProgress > 80 ? 'bg-green-400' : 'bg-white/30'}`} />
            Creating custom configuration
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70">Click "Next" to start AI analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Analysis Complete!</h3>
        <p className="text-white/70">Here's what our AI discovered about your studio</p>
      </div>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market Analysis */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <TrendingUp className="h-5 w-5 mr-2" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-3">
            <div className="flex justify-between">
              <span>Market Demand:</span>
              <Badge variant={analysis.marketDemand === 'High' ? 'default' : 'secondary'}>
                {analysis.marketDemand}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Competition Level:</span>
              <Badge variant={analysis.competition === 'Low' ? 'default' : 'secondary'}>
                {analysis.competition}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Growth Potential:</span>
              <Badge variant={analysis.growthPotential === 'High' ? 'default' : 'secondary'}>
                {analysis.growthPotential}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Users className="h-5 w-5 mr-2" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-3">
            <div>
              <span className="font-medium">Primary Demographics:</span>
              <p className="text-sm text-white/60 mt-1">{analysis.primaryDemographics}</p>
            </div>
            <div>
              <span className="font-medium">Best Class Times:</span>
              <p className="text-sm text-white/60 mt-1">{analysis.bestClassTimes}</p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Projections */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <DollarSign className="h-5 w-5 mr-2" />
              Revenue Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-3">
            <div className="flex justify-between">
              <span>Monthly Potential:</span>
              <span className="font-bold text-green-400">{analysis.monthlyRevenue}</span>
            </div>
            <div className="flex justify-between">
              <span>Break-even Timeline:</span>
              <span>{analysis.breakEvenTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended Pricing:</span>
              <span>{analysis.recommendedPricing}</span>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Recommendations */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Target className="h-5 w-5 mr-2" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white/80">
            <ul className="space-y-2 text-sm">
              {analysis.recommendations?.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {rec}
                </li>
              )) || [
                'Focus on morning and evening classes',
                'Offer beginner-friendly sessions',
                'Implement membership packages',
                'Consider corporate partnerships'
              ]}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Success Metrics */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400/30">
        <CardContent className="p-6">
          <h4 className="text-white font-bold text-lg mb-4">Success Probability</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="bg-white/20 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full"
                  style={{ width: `${analysis.successProbability || 85}%` }}
                />
              </div>
            </div>
            <span className="text-white font-bold">{analysis.successProbability || 85}%</span>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Based on market conditions, location, and your experience level
          </p>
        </CardContent>
      </Card>
    </div>
  )
}