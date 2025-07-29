'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw,
  Eye,
  Download,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import DataMigrationWizard from './DataMigrationWizard'

export default function MigrationDashboard() {
  const { user } = useAuth()
  const [migrationHistory, setMigrationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedMigration, setSelectedMigration] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMigrationHistory()
    }
  }, [user])

  const fetchMigrationHistory = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/server-api/migration/history', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMigrationHistory(data.history || [])
      } else {
        console.error('Failed to fetch migration history')
      }
    } catch (error) {
      console.error('Migration history error:', error)
      toast.error('Failed to load migration history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      uploaded: { variant: 'secondary', text: 'Uploaded', icon: Upload },
      parsing: { variant: 'default', text: 'Parsing', icon: FileText },
      parsed: { variant: 'default', text: 'Parsed', icon: CheckCircle },
      importing: { variant: 'default', text: 'Importing', icon: Database },
      completed: { variant: 'default', text: 'Completed', icon: CheckCircle },
      parse_failed: { variant: 'destructive', text: 'Parse Failed', icon: AlertTriangle },
      import_failed: { variant: 'destructive', text: 'Import Failed', icon: AlertTriangle }
    }

    const config = statusConfig[status] || { variant: 'secondary', text: status, icon: Clock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    )
  }

  const getConfidenceBadge = (confidence) => {
    if (!confidence) return null
    
    const percentage = Math.round(confidence * 100)
    let variant = 'secondary'
    
    if (percentage >= 90) variant = 'default'
    else if (percentage >= 70) variant = 'secondary'
    else variant = 'destructive'

    return (
      <Badge variant={variant}>
        {percentage}% Confidence
      </Badge>
    )
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleViewDetails = async (migration) => {
    if (migration.status === 'parsed' || migration.status === 'completed') {
      try {
        const response = await fetch(`/server-api/migration/parsed/parsed_${migration.uploadId}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setSelectedMigration({ ...migration, details: data })
        }
      } catch (error) {
        console.error('Failed to fetch migration details:', error)
        toast.error('Failed to load migration details')
      }
    }
  }

  const handleRetryMigration = (migration) => {
    // For now, just open the wizard - in a full implementation, you'd restore the previous state
    setShowWizard(true)
    toast.info('Starting new migration. Previous data can be used as reference.')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Data Migration</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Migration
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Migration</h2>
          <p className="text-gray-600 mt-1">
            Import your studio data from Mindbody, Acuity, or custom formats
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Migration
        </Button>
      </div>

      {/* Migration Overview */}
      {migrationHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Migrations</p>
                  <p className="text-2xl font-bold">{migrationHistory.length}</p>
                </div>
                <Database className="h-8 w-8 text-[#1E90FF]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {migrationHistory.filter(m => m.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-[#1E90FF]">
                    {Math.round((migrationHistory.filter(m => m.status === 'completed').length / migrationHistory.length) * 100)}%
                  </p>
                </div>
                <Upload className="h-8 w-8 text-[#1E90FF]" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Migration History */}
      <Card>
        <CardHeader>
          <CardTitle>Migration History</CardTitle>
          <CardDescription>
            View and manage your data migration attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrationHistory.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No migrations yet</h3>
              <p className="text-gray-600 mb-4">
                Start by uploading your studio data to migrate to Thryve
              </p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start First Migration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {migrationHistory.map((migration) => (
                <div key={migration.uploadId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{migration.fileName}</h4>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(migration.fileSize)} • {new Date(migration.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {migration.parseConfidence && getConfidenceBadge(migration.parseConfidence)}
                      {migration.parseMethod && (
                        <Badge variant="outline">
                          {migration.parseMethod === 'rule-based' ? 'Rule-Based' : 'AI-Assisted'}
                        </Badge>
                      )}
                      {getStatusBadge(migration.status)}
                    </div>
                  </div>

                  {/* Import Results */}
                  {migration.importResults && (
                    <div className="mb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(migration.importResults).map(([type, result]) => (
                          <div key={type} className="text-center">
                            <div className="text-lg font-semibold text-green-600">{result.imported}</div>
                            <div className="text-xs text-gray-500 capitalize">{type}</div>
                            {result.skipped > 0 && (
                              <div className="text-xs text-orange-600">{result.skipped} skipped</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      {(migration.status === 'parsed' || migration.status === 'completed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(migration)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}
                      {(migration.status === 'parse_failed' || migration.status === 'import_failed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryMigration(migration)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {migration.parsedAt && `Parsed: ${new Date(migration.parsedAt).toLocaleString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Details Modal */}
      {selectedMigration && (
        <MigrationDetailsModal
          migration={selectedMigration}
          onClose={() => setSelectedMigration(null)}
        />
      )}

      {/* Migration Wizard */}
      <DataMigrationWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false)
          fetchMigrationHistory() // Refresh history after wizard closes
        }}
      />
    </div>
  )
}

// Migration Details Modal Component
function MigrationDetailsModal({ migration, onClose }) {
  if (!migration?.details) return null

  const { details } = migration

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Migration Details</CardTitle>
              <CardDescription>{migration.fileName}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="max-h-[70vh] overflow-y-auto space-y-6">
          {/* Summary */}
          <div>
            <h4 className="font-medium mb-3">Import Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(details.data).map(([type, items]) => (
                <Card key={type} className="p-3">
                  <div className="text-center">
                    <div className="text-xl font-bold">{items?.length || 0}</div>
                    <div className="text-sm text-gray-600 capitalize">{type}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {details.aiInsights && (
            <div>
              <h4 className="font-medium mb-2">AI Insights</h4>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">{details.aiInsights}</p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {details.warnings && details.warnings.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Warnings</h4>
              <div className="bg-orange-50 p-3 rounded-lg">
                <ul className="text-orange-800 text-sm space-y-1">
                  {details.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Data Preview */}
          <div>
            <h4 className="font-medium mb-3">Data Preview</h4>
            <div className="space-y-4">
              {Object.entries(details.data).map(([type, items]) => {
                if (!items || items.length === 0) return null
                
                return (
                  <div key={type}>
                    <h5 className="font-medium capitalize mb-2">{type} ({items.length})</h5>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(items.slice(0, 3), null, 2)}
                      </pre>
                      {items.length > 3 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ... and {items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}