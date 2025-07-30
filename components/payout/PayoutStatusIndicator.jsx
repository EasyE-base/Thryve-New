'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Calendar
} from 'lucide-react'
import { getPayoutStatusColor } from '@/lib/utils'

const PayoutStatusIndicator = ({ 
  status, 
  amount, 
  date, 
  showIcon = true, 
  showAmount = true, 
  showDate = true,
  size = 'default' 
}) => {
  const getStatusIcon = (status) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
    
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className={`${iconSize} text-green-600`} />
      case 'pending':
      case 'processing':
        return <Clock className={`${iconSize} text-yellow-600`} />
      case 'failed':
      case 'error':
      case 'cancelled':
        return <XCircle className={`${iconSize} text-red-600`} />
      case 'scheduled':
        return <Calendar className={`${iconSize} text-blue-600`} />
      default:
        return <AlertCircle className={`${iconSize} text-gray-600`} />
    }
  }

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completed'
      case 'success':
        return 'Success'
      case 'pending':
        return 'Pending'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      case 'error':
        return 'Error'
      case 'cancelled':
        return 'Cancelled'
      case 'scheduled':
        return 'Scheduled'
      default:
        return status || 'Unknown'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${size === 'sm' ? 'text-sm' : ''}`}>
      {showIcon && getStatusIcon(status)}
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${getPayoutStatusColor(status)} ${size === 'sm' ? 'text-xs' : ''}`}
          >
            {getStatusText(status)}
          </Badge>
          
          {showAmount && amount && (
            <span className={`font-medium ${size === 'sm' ? 'text-sm' : ''}`}>
              ${parseFloat(amount).toFixed(2)}
            </span>
          )}
        </div>
        
        {showDate && date && (
          <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {new Date(date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}

export default PayoutStatusIndicator