'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Upload, FileText, Database, AlertTriangle, Info, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

const MIGRATION_STEPS = [
  { id: 1, title: 'Upload', description: 'Upload your data file', icon: Upload },
  { id: 2, title: 'Parse', description: 'AI processes your data', icon: FileText },
  { id: 3, title: 'Review', description: 'Review and edit data', icon: CheckCircle },
  { id: 4, title: 'Import', description: 'Import into Thryve', icon: Database }
]

export default function DataMigrationWizard({ isOpen, onClose }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadId, setUploadId] = useState(null)
  const [parsedDataId, setParsedDataId] = useState(null)
  const [migrationData, setMigrationData] = useState(null)
  const [parseResults, setParseResults] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resetWizard = () => {
    setCurrentStep(1)
    setUploadProgress(0)
    setUploadId(null)
    setParsedDataId(null)
    setMigrationData(null)
    setParseResults(null)
    setImportResults(null)
    setLoading(false)
    setError(null)
  }

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return

    const maxSize = 100 * 1024 * 1024 // 100MB limit
    if (file.size > maxSize) {
      setError('File size must be less than 100MB')
      return
    }

    const supportedTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel']
    if (!supportedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(csv|json|xlsx)$/)) {
      setError('Please upload a CSV, JSON, or Excel file')
      return
    }

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Read file as text or base64 depending on type
      const fileData = await readFileAsText(file)
      const chunkSize = 1024 * 1024 // 1MB chunks
      const totalChunks = Math.ceil(fileData.length / chunkSize)

      if (totalChunks === 1) {
        // Single chunk upload
        const response = await fetch('/server-api/migration/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: fileData,
            fileSize: file.size,
            mimeType: file.type
          })
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        setUploadId(result.uploadId)
        setUploadProgress(100)
        toast.success('File uploaded successfully!')
        setCurrentStep(2)
      } else {
        // Chunked upload
        let uploadId = null
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize
          const end = Math.min(start + chunkSize, fileData.length)
          const chunkData = fileData.slice(start, end)

          const response = await fetch('/server-api/migration/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({
              fileName: file.name,
              fileData: chunkData,
              fileSize: file.size,
              mimeType: file.type,
              chunkIndex: i,
              totalChunks: totalChunks
            })
          })

          const result = await response.json()
          
          if (!response.ok) {
            throw new Error(result.error || 'Upload failed')
          }

          uploadId = result.uploadId
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 100))

          if (result.status === 'complete') {
            setUploadId(uploadId)
            toast.success('File uploaded successfully!')
            setCurrentStep(2)
            break
          }
        }
      }

    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message)
      toast.error('Upload failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  const handleParseData = async () => {
    if (!uploadId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/server-api/migration/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ uploadId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Parsing failed')
      }

      setParsedDataId(result.parsedDataId)
      setParseResults(result)
      toast.success(`Data parsed successfully using ${result.method} method`)
      setCurrentStep(3)

    } catch (error) {
      console.error('Parse error:', error)
      setError(error.message)
      toast.error('Parsing failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportData = async (selectedData = {}, resolveConflicts = {}) => {
    if (!parsedDataId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/server-api/migration/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          parsedDataId,
          selectedData,
          resolveConflicts
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportResults(result.importResults)
      toast.success(result.message)
      setCurrentStep(4)

    } catch (error) {
      console.error('Import error:', error)
      setError(error.message)
      toast.error('Import failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep onFileUpload={handleFileUpload} loading={loading} progress={uploadProgress} />
      case 2:
        return <ParseStep onParse={handleParseData} loading={loading} uploadId={uploadId} />
      case 3:
        return <ReviewStep parseResults={parseResults} onImport={handleImportData} loading={loading} />
      case 4:
        return <ImportComplete importResults={importResults} onClose={onClose} onRestart={resetWizard} />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-2xl">AI Data Migration Wizard</CardTitle>
          <CardDescription>
            Import your studio data from Mindbody, Acuity, or custom formats
          </CardDescription>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {MIGRATION_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-[#1E90FF] border-[#1E90FF] text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="ml-3">
                    <div className={`font-medium ${isActive ? 'text-[#1E90FF]' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {step.description}
                    </div>
                  </div>
                  {index < MIGRATION_STEPS.length - 1 && (
                    <div className={`mx-4 h-0.5 w-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="max-h-[60vh] overflow-y-auto">
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  )
}

// Upload Step Component
function UploadStep({ onFileUpload, loading, progress }) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files[0]) {
      onFileUpload(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files[0]) {
      onFileUpload(files[0])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Your Data File</h3>
        <p className="text-gray-600">
          Supported formats: CSV, JSON, Excel files from Mindbody, Acuity, or custom exports
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-[#1E90FF] bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={(e) => e.preventDefault()}
        onDragLeave={(e) => e.preventDefault()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {loading ? (
          <div className="space-y-4">
            <p className="text-gray-600">Uploading file...</p>
            <Progress value={progress} className="w-full max-w-xs mx-auto" />
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>
        ) : (
          <>
            <p className="text-lg mb-2">Drag and drop your file here, or</p>
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button as="span" className="cursor-pointer">
                Choose File
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-4">
              Maximum file size: 100MB
            </p>
          </>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Supported Data Sources:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Mindbody exports (classes, clients, staff)</li>
          <li>• Acuity Scheduling data</li>
          <li>• Custom CSV with class and client information</li>
          <li>• JSON files with structured fitness data</li>
        </ul>
      </div>
    </div>
  )
}

// Parse Step Component
function ParseStep({ onParse, loading, uploadId }) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <FileText className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Parse Your Data</h3>
        <p className="text-gray-600">
          Our AI will analyze your file and extract classes, instructors, and client data
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800 font-medium">AI-Powered Parsing</span>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          We'll attempt rule-based parsing first, then use OpenAI for complex data structures
        </p>
      </div>

      <Button 
        onClick={onParse} 
        disabled={loading || !uploadId}
        className="w-full max-w-sm"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Parsing Data...
          </div>
        ) : (
          'Start AI Parsing'
        )}
      </Button>
    </div>
  )
}

// Review Step Component
function ReviewStep({ parseResults, onImport, loading }) {
  const [selectedData, setSelectedData] = useState({
    classes: true,
    instructors: true,
    clients: true,
    schedules: true
  })

  if (!parseResults) {
    return <div>Loading parsed data...</div>
  }

  const { summary, confidence, method, warnings, aiInsights } = parseResults

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review Parsed Data</h3>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant={confidence > 0.8 ? 'default' : 'secondary'}>
            {Math.round(confidence * 100)}% Confidence
          </Badge>
          <Badge variant="outline">
            {method === 'rule-based' ? 'Rule-Based' : 'AI-Assisted'} Parsing
          </Badge>
        </div>
      </div>

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Warnings Found:</div>
            <ul className="text-sm list-disc list-inside">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(summary).map(([type, count]) => (
          <Card key={type} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}</div>
              </div>
              <input
                type="checkbox"
                checked={selectedData[type]}
                onChange={(e) => setSelectedData({
                  ...selectedData,
                  [type]: e.target.checked
                })}
                className="h-4 w-4"
              />
            </div>
          </Card>
        ))}
      </div>

      {aiInsights && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">AI Insights</span>
          </div>
          <p className="text-green-700 text-sm">{aiInsights}</p>
        </div>
      )}

      <Button 
        onClick={() => onImport(selectedData)}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Importing Data...
          </div>
        ) : (
          'Import Selected Data'
        )}
      </Button>
    </div>
  )
}

// Import Complete Component
function ImportComplete({ importResults, onClose, onRestart }) {
  if (!importResults) {
    return <div>Loading import results...</div>
  }

  const total = Object.values(importResults).reduce((sum, result) => sum + result.imported, 0)

  return (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
        <p className="text-gray-600">
          Successfully imported {total} records into your Thryve studio
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(importResults).map(([type, result]) => (
          <Card key={type} className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.imported}</div>
              <div className="text-sm text-gray-600 capitalize">{type}</div>
              {result.skipped > 0 && (
                <div className="text-xs text-orange-600">{result.skipped} skipped</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex space-x-4 justify-center">
        <Button onClick={onClose} size="lg">
          Go to Dashboard
        </Button>
        <Button onClick={onRestart} variant="outline" size="lg">
          Import More Data
        </Button>
      </div>
    </div>
  )
}