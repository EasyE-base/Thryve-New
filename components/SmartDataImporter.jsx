'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, FileText, Brain, CheckCircle, AlertTriangle, 
  ArrowRight, RefreshCw, Download, Target, Zap,
  Building2, Users, Calendar, CreditCard, UserCheck,
  Loader2, Eye, ThumbsUp, ThumbsDown, Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

const PLATFORM_TEMPLATES = {
  mindbody: {
    name: 'Mindbody',
    color: 'bg-blue-500/20 text-blue-200 border-blue-400/20',
    description: 'Most popular fitness platform'
  },
  vagaro: {
    name: 'Vagaro',
    color: 'bg-purple-500/20 text-purple-200 border-purple-400/20',
    description: 'Salon & fitness platform'
  },
  zenplanner: {
    name: 'ZenPlanner',
    color: 'bg-green-500/20 text-green-200 border-green-400/20',
    description: 'Martial arts & fitness'
  },
  classpass: {
    name: 'ClassPass',
    color: 'bg-orange-500/20 text-orange-200 border-orange-400/20',
    description: 'Class marketplace'
  },
  other: {
    name: 'Other Platform',
    color: 'bg-gray-500/20 text-gray-200 border-gray-400/20',
    description: 'Custom or other system'
  }
}

const FILE_TYPE_ICONS = {
  customers: Users,
  classes: Calendar,
  instructors: UserCheck,
  schedule: Calendar,
  payments: CreditCard,
  mixed: Building2
}

export default function SmartDataImporter() {
  const { user, userRole } = useAuth()
  const [currentStep, setCurrentStep] = useState('upload') // upload, analyze, map, import, complete
  const [file, setFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [mappings, setMappings] = useState([])
  const [validation, setValidation] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    setFile(selectedFile)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      setFileContent(e.target.result)
      toast.success(`File "${selectedFile.name}" loaded successfully!`)
    }
    
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    
    reader.readAsText(selectedFile)
  }

  const analyzeFile = async () => {
    if (!file || !fileContent) {
      toast.error('Please select a file first')
      return
    }

    setLoading(true)
    setProgress(25)

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/import/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileContent: fileContent,
          fileName: file.name
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        setMappings(data.analysis.fieldMappings || [])
        setCurrentStep('analyze')
        setProgress(50)
        toast.success('🤖 AI analysis complete! Review the field mappings.')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze file')
    } finally {
      setLoading(false)
    }
  }

  const validateMappings = async () => {
    setLoading(true)
    setProgress(75)

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/import/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mappings: mappings
        })
      })

      if (response.ok) {
        const data = await response.json()
        setValidation(data.validation)
        setCurrentStep('map')
        toast.success('Mappings validated successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Validation failed')
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Failed to validate mappings')
    } finally {
      setLoading(false)
    }
  }

  const executeImport = async () => {
    if (!validation?.valid) {
      toast.error('Please fix validation errors before importing')
      return
    }

    setLoading(true)
    setProgress(90)

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/import/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileContent: fileContent,
          mappings: mappings,
          importConfig: {
            fileName: file.name,
            batchSize: 100
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setImportResult(data.result)
        setCurrentStep('complete')
        setProgress(100)
        toast.success(`🎉 Import complete! ${data.result.successfulImports} records imported successfully.`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to execute import')
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = (index, field, value) => {
    const newMappings = [...mappings]
    newMappings[index][field] = value
    setMappings(newMappings)
  }

  const getStepStatus = (step) => {
    const steps = ['upload', 'analyze', 'map', 'import', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  const renderPlatformBadge = (platform) => {
    const config = PLATFORM_TEMPLATES[platform] || PLATFORM_TEMPLATES.other
    return (
      <Badge className={config.color}>
        <Building2 className="h-3 w-3 mr-1" />
        {config.name}
      </Badge>
    )
  }

  const renderFileTypeIcon = (fileType) => {
    const IconComponent = FILE_TYPE_ICONS[fileType] || Building2
    return <IconComponent className="h-4 w-4" />
  }

  if (userRole !== 'merchant') {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Studio Access Required</h3>
        <p className="text-blue-200">Data import is only available to studio owners.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Smart Data Importer</h1>
          </div>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto">
            Seamlessly migrate your data from Mindbody, Vagaro, or any other platform. Our AI analyzes your files and handles the complex mapping automatically.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Import Progress</h3>
              <span className="text-blue-200 text-sm">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="w-full h-3 mb-4" />
            
            <div className="flex items-center justify-between">
              {['Upload', 'Analyze', 'Map', 'Import', 'Complete'].map((step, index) => {
                const stepKey = step.toLowerCase()
                const status = getStepStatus(stepKey)
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'active' ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-sm">{index + 1}</span>
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${
                      status === 'active' ? 'text-white font-medium' : 'text-blue-300'
                    }`}>
                      {step}
                    </span>
                    {index < 4 && (
                      <ArrowRight className="h-4 w-4 text-blue-400 ml-4" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 'upload' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Your Data File
              </CardTitle>
              <CardDescription className="text-blue-200">
                Upload a CSV or Excel file from your previous fitness platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {file ? file.name : 'Drop your data file here'}
                </h3>
                <p className="text-blue-200 mb-4">
                  {file ? `${Math.round(file.size / 1024)} KB • Ready to analyze` : 'or click to browse your files'}
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>

              {/* Platform Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="text-white font-medium mb-2">Common Platforms</h4>
                  <div className="space-y-2">
                    {Object.entries(PLATFORM_TEMPLATES).slice(0, 3).map(([key, platform]) => (
                      <Badge key={key} className={platform.color}>
                        {platform.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-white font-medium mb-2">Supported Data Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center text-blue-200 text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      Customers & Members
                    </div>
                    <div className="flex items-center justify-center text-blue-200 text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Classes & Schedule
                    </div>
                    <div className="flex items-center justify-center text-blue-200 text-sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Instructors & Staff
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-white font-medium mb-2">File Formats</h4>
                  <div className="space-y-2">
                    <Badge className="bg-green-500/20 text-green-200 border-green-400/20">
                      CSV Files
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/20">
                      Excel Files
                    </Badge>
                  </div>
                </div>
              </div>

              {file && (
                <div className="flex justify-center">
                  <Button
                    onClick={analyzeFile}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        AI is analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'analyze' && analysis && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Analysis Results
              </CardTitle>
              <CardDescription className="text-blue-200">
                Our AI has analyzed your data and detected the following structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 border border-blue-400/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      {renderFileTypeIcon(analysis.fileType)}
                      <span className="ml-2 text-white font-medium">File Type</span>
                    </div>
                    <p className="text-blue-200 text-sm capitalize">{analysis.fileType}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 border border-purple-400/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-4 w-4" />
                      <span className="ml-2 text-white font-medium">Confidence</span>
                    </div>
                    <p className="text-purple-200 text-sm">{Math.round(analysis.confidence * 100)}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/30 to-green-700/30 border border-green-400/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="ml-2 text-white font-medium">Records</span>
                    </div>
                    <p className="text-green-200 text-sm">{analysis.totalRecords}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900/30 to-orange-700/30 border border-orange-400/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Building2 className="h-4 w-4" />
                      <span className="ml-2 text-white font-medium">Platform</span>
                    </div>
                    {renderPlatformBadge(analysis.detectedPlatform)}
                  </CardContent>
                </Card>
              </div>

              {/* Field Mappings Preview */}
              <div>
                <h4 className="text-white font-semibold mb-4">Detected Fields ({mappings.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mappings.slice(0, 6).map((mapping, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{mapping.originalHeader}</span>
                        <Badge className={`text-xs ${
                          mapping.confidence >= 0.9 ? 'bg-green-500/20 text-green-200' :
                          mapping.confidence >= 0.7 ? 'bg-blue-500/20 text-blue-200' :
                          'bg-yellow-500/20 text-yellow-200'
                        }`}>
                          {Math.round(mapping.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-blue-200 text-xs">{mapping.reasoning}</p>
                      <p className="text-blue-300 text-xs mt-1">→ {mapping.suggestedField}</p>
                    </div>
                  ))}
                </div>
                
                {mappings.length > 6 && (
                  <p className="text-blue-300 text-sm text-center mt-4">
                    +{mappings.length - 6} more fields detected
                  </p>
                )}
              </div>

              {/* Next Step */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => setCurrentStep('upload')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back to Upload
                </Button>
                <Button
                  onClick={validateMappings}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Proceed to Mapping
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'complete' && importResult && (
          <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border border-green-400/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                Import Complete!
              </CardTitle>
              <CardDescription className="text-green-200">
                Your data has been successfully imported into Thryve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{importResult.successfulImports}</div>
                  <div className="text-green-200 text-sm">Records Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{Math.round(importResult.executionTime / 1000)}s</div>
                  <div className="text-blue-200 text-sm">Execution Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {importResult.totalRecords > 0 ? Math.round((importResult.successfulImports / importResult.totalRecords) * 100) : 0}%
                  </div>
                  <div className="text-purple-200 text-sm">Success Rate</div>
                </div>
              </div>

              {/* Next Steps */}
              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    What's Next?
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                      <p className="text-blue-200">Review your imported data in the main dashboard</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                      <p className="text-blue-200">Set up your class schedules and instructor assignments</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                      <p className="text-blue-200">Configure your booking rules and pricing</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                      <p className="text-blue-200">Launch your new Thryve-powered studio!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => window.location.href = '/dashboard/merchant'}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep('upload')
                    setFile(null)
                    setFileContent('')
                    setAnalysis(null)
                    setMappings([])
                    setValidation(null)
                    setImportResult(null)
                    setProgress(0)
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Import Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}