'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  CreditCard
} from 'lucide-react'

const PayoutSummaryCard = ({ 
  title, 
  amount, 
  change, 
  changeType = 'neutral', 
  period = 'vs last month',
  icon: Icon = DollarSign,
  additionalInfo = null,
  loading = false 
}) => {
  const getTrendIcon = (type) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (type) => {
    switch (type) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof amount === 'number' ? `$${amount.toFixed(2)}` : amount}
            </p>
            
            {change !== null && change !== undefined && (
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(changeType)}
                <span className={`text-sm ${getTrendColor(changeType)}`}>
                  {typeof change === 'number' ? 
                    `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 
                    change}
                </span>
                <span className="text-xs text-muted-foreground">{period}</span>
              </div>
            )}
            
            {additionalInfo && (
              <div className="mt-2">
                {typeof additionalInfo === 'string' ? (
                  <p className="text-xs text-muted-foreground">{additionalInfo}</p>
                ) : (
                  additionalInfo
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Specialized payout summary cards
export const EarningsSummaryCard = ({ totalEarnings, monthlyEarnings, loading }) => (
  <PayoutSummaryCard
    title="Total Earnings"
    amount={totalEarnings}
    change={monthlyEarnings ? ((monthlyEarnings / totalEarnings) * 100) : null}
    changeType="positive"
    period="this month"
    icon={DollarSign}
    loading={loading}
  />
)

export const PayoutsSummaryCard = ({ totalPayouts, recentPayouts, loading }) => (
  <PayoutSummaryCard
    title="Total Payouts"
    amount={totalPayouts}
    additionalInfo={
      recentPayouts && recentPayouts.length > 0 ? (
        <Badge variant="outline" className="text-xs">
          Last: {new Date(recentPayouts[0].createdAt).toLocaleDateString()}
        </Badge>
      ) : null
    }
    icon={CreditCard}
    loading={loading}
  />
)

export const NextPayoutCard = ({ nextPayoutDate, pendingAmount, payoutSchedule, loading }) => (
  <PayoutSummaryCard
    title="Next Payout"
    amount={nextPayoutDate ? new Date(nextPayoutDate).toLocaleDateString() : 'TBD'}
    additionalInfo={
      <div className="flex flex-col gap-1">
        {pendingAmount && (
          <span className="text-xs text-muted-foreground">
            Pending: ${pendingAmount.toFixed(2)}
          </span>
        )}
        {payoutSchedule && (
          <Badge variant="outline" className="text-xs w-fit">
            {payoutSchedule} schedule
          </Badge>
        )}
      </div>
    }
    icon={Calendar}
    loading={loading}
  />
)

export default PayoutSummaryCard