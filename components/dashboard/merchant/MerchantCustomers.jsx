'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, TrendingUp, Calendar, Star } from 'lucide-react'

export default function MerchantCustomers() {
  const { customers } = useDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <p className="text-gray-600">Overview of your studio members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Total Customers</span>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {customers?.length ? 'Active customers' : 'No customers yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Active Members</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.filter(c => c.status === 'active').length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {customers?.filter(c => c.status === 'active').length ? 'Active members' : 'No active members'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Avg Rating</span>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers?.length ? '4.8' : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {customers?.length ? 'Average customer rating' : 'No ratings yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Customers</h3>
        </CardHeader>
        <CardContent>
          {customers && customers.length > 0 ? (
            <div className="space-y-3">
              {customers.slice(0, 8).map((customer, index) => (
                <div key={customer.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {customer.displayName?.charAt(0) || customer.firstName?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {customer.displayName || customer.firstName || `Customer ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {customer.status || 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No customers yet</p>
              <p className="text-sm text-gray-400 mt-1">Customers will appear here once they book classes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}