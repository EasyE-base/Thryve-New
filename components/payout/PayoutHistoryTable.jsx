'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Download,
  Filter,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import PayoutStatusIndicator from './PayoutStatusIndicator'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const PayoutHistoryTable = ({ 
  payouts = [], 
  loading = false, 
  onViewDetails,
  onDownloadReceipt,
  showSearch = true,
  showActions = true,
  pageSize = 10 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter payouts based on search and status
  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = !searchTerm || 
      payout.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Paginate results
  const totalPages = Math.ceil(filteredPayouts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedPayouts = filteredPayouts.slice(startIndex, startIndex + pageSize)

  const getUniqueStatuses = () => {
    const statuses = [...new Set(payouts.map(p => p.status).filter(Boolean))]
    return statuses.sort()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payout History</CardTitle>
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payouts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">All Status</option>
              {getUniqueStatuses().map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedPayouts.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  {showActions && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayouts.map((payout, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-mono text-sm">
                          {payout.id?.slice(-8) || `#${Date.now()}`}
                        </p>
                        {payout.stripeTransferId && (
                          <p className="text-xs text-muted-foreground">
                            Stripe: {payout.stripeTransferId.slice(-8)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDateTime(payout.createdAt)}
                        </p>
                        {payout.processedAt && payout.processedAt !== payout.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            Processed: {new Date(payout.processedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {formatCurrency(payout.amount)}
                        </p>
                        {payout.fee && payout.fee > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Fee: {formatCurrency(payout.fee)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <PayoutStatusIndicator
                        status={payout.status}
                        showIcon={true}
                        showAmount={false}
                        showDate={false}
                        size="sm"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">
                        {payout.payoutType || 'scheduled'}
                      </Badge>
                    </TableCell>
                    
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails?.(payout)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {payout.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadReceipt?.(payout)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredPayouts.length)} of {filteredPayouts.length} payouts
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <Filter className="h-full w-full" />
            </div>
            <p className="text-muted-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No payouts match your filters' : 'No payout history yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 
                'Try adjusting your search or filter criteria' : 
                'Your payout history will appear here once you start receiving payments'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PayoutHistoryTable