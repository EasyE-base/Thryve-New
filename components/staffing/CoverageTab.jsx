'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCheck, AlertTriangle, Eye } from 'lucide-react'

// ✅ EXTRACTED: Coverage tab for staffing dashboard
export default function CoverageTab({ dashboard }) {
  if (!dashboard?.openCoverage || dashboard.openCoverage.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">No Coverage Requests</h3>
        <p className="text-blue-200">All classes are currently covered.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Coverage Requests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.openCoverage.map((request) => (
          <Card key={request.id} className="bg-orange-500/10 backdrop-blur-sm border-orange-400/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-semibold">Coverage Needed</h3>
                <Badge className="bg-orange-500/20 text-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Open
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="text-orange-200">
                  <strong>Applicants:</strong> {request.applicants?.length || 0}
                </div>
                {request.message && (
                  <div className="text-orange-200">
                    <strong>Message:</strong> {request.message}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-400/20"
              >
                <Eye className="h-3 w-3 mr-1" />
                Review Applicants
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}