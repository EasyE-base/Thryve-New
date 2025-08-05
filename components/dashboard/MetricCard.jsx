'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ✅ REUSABLE METRIC CARD COMPONENT
export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection,
  color = 'blue',
  format = 'number',
  loading = false,
  className = ''
}) {

  // ✅ FORMAT VALUE BASED ON TYPE
  const formatValue = (val, format) => {
    if (loading || val === null || val === undefined) return '---'
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      
      case 'percentage':
        return `${Math.round(val)}%`
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(val)
      
      case 'decimal':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(val)
      
      default:
        return val
    }
  }

  // ✅ COLOR VARIANTS
  const colorVariants = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        
        {Icon && (
          <div className={`
            p-2 rounded-lg bg-gradient-to-br ${colorVariants[color]} text-white
          `}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          {/* Main Value */}
          <div className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            ) : (
              formatValue(value, format)
            )}
          </div>
          
          {/* Subtitle and Trend */}
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-gray-500">
                {subtitle}
              </p>
            )}
            
            {trend && trendDirection && (
              <div className="flex items-center space-x-1">
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                
                <Badge 
                  variant="secondary" 
                  className={`
                    text-xs px-1.5 py-0.5
                    ${trendDirection === 'up' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                    }
                  `}
                >
                  {typeof trend === 'number' ? `${Math.abs(trend)}%` : trend}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}