'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, X } from 'lucide-react'

// ✅ EXTRACTED: Approvals tab for staffing dashboard
export default function ApprovalsTab({ dashboard, onApproveSwap, submitting }) {
  if (!dashboard?.pendingSwaps || dashboard.pendingSwaps.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">No Pending Approvals</h3>
        <p className="text-blue-200">All swap requests have been processed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Pending Swap Approvals</h2>
      
      <div className="space-y-3">
        {dashboard.pendingSwaps.map((request) => (
          <Card key={request.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">Swap Request</h3>
                  <p className="text-blue-200 text-sm">
                    Between instructors for a class
                  </p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting Approval
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="text-blue-300">
                  <strong>Class:</strong> Class details would be here
                </div>
                <div className="text-blue-300">
                  <strong>Message:</strong> {request.message || 'No message provided'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onApproveSwap(request.id, true)}
                  disabled={submitting}
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/20"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {submitting ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => onApproveSwap(request.id, false, 'Denied by studio management')}
                  disabled={submitting}
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20"
                >
                  <X className="h-3 w-3 mr-1" />
                  {submitting ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}