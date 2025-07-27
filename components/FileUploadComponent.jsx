'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, X, Check, AlertCircle, Image, FileText, 
  User, Building2, Camera, File, Trash2, Eye, Download
} from 'lucide-react'
import { toast } from 'sonner'

const FILE_TYPES = {
  profile: {
    label: 'Profile Image',
    icon: User,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Upload your profile picture (JPG, PNG, GIF)'
  },
  class: {
    label: 'Class Image',
    icon: Camera,
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Upload class promotional image (JPG, PNG)'
  },
  studio: {
    label: 'Studio Branding',
    icon: Building2,
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Upload studio logo or branding assets (JPG, PNG)'
  },
  document: {
    label: 'Document',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.txt',
    maxSize: 20 * 1024 * 1024, // 20MB
    description: 'Upload documents (PDF, DOC, DOCX, TXT)'
  }
}

export default function FileUploadComponent({ 
  fileType = 'profile', 
  entityId = null, 
  onUploadComplete = null,
  showFileList = true,
  maxFiles = 5 
}) {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const config = FILE_TYPES[fileType] || FILE_TYPES.profile

  // Fetch uploaded files on component mount
  const fetchUploadedFiles = useCallback(async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams({
        type: fileType,
        ...(entityId && { entityId })
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/files/list?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setUploadedFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
    }
  }, [user, fileType, entityId])

  // File validation
  const validateFile = (file) => {
    const errors = []

    // Size validation
    if (file.size > config.maxSize) {
      errors.push(`File size must be less than ${Math.round(config.maxSize / (1024 * 1024))}MB`)
    }

    // Type validation for images
    if (fileType !== 'document' && !file.type.startsWith('image/')) {
      errors.push('File must be an image')
    }

    return errors
  }

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).slice(0, maxFiles - files.length)
    const validFiles = []
    const invalidFiles = []

    newFiles.forEach(file => {
      const errors = validateFile(file)
      if (errors.length === 0) {
        validFiles.push({
          file,
          id: `file-${Date.now()}-${Math.random()}`,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          errors: []
        })
      } else {
        invalidFiles.push({ file, errors })
      }
    })

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, errors }) => {
        toast.error(`${file.name}: ${errors.join(', ')}`)
      })
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} selected`)
    }
  }

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [])

  // Upload files with progress tracking
  const uploadFiles = async () => {
    if (!user || files.length === 0) return

    setUploading(true)
    const token = await user.getIdToken()

    for (const fileObj of files) {
      const { file, id } = fileObj

      try {
        // Prepare form data
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', fileType)
        if (entityId) {
          formData.append('entityId', entityId)
        }

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(prev => ({ ...prev, [id]: progress }))
          }
        })

        // Handle completion
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`))
            }
          }
          xhr.onerror = () => reject(new Error('Upload failed'))
        })

        // Start upload
        xhr.open('POST', `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/files/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)

        // Wait for completion
        const response = await uploadPromise

        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [id]: 100 }))

        toast.success(`${file.name} uploaded successfully`)

        // Call completion callback
        if (onUploadComplete) {
          onUploadComplete(response)
        }

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}`)
        setUploadProgress(prev => ({ ...prev, [id]: -1 })) // -1 indicates error
      }
    }

    // Refresh file list and reset
    await fetchUploadedFiles()
    setFiles([])
    setUploadProgress({})
    setUploading(false)
  }

  // Remove file from upload queue
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }

  // Delete uploaded file
  const deleteUploadedFile = async (fileId) => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
        toast.success('File deleted successfully')
      } else {
        toast.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Initialize file list fetch
  React.useEffect(() => {
    fetchUploadedFiles()
  }, [fetchUploadedFiles])

  const IconComponent = config.icon

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <IconComponent className="h-5 w-5 mr-2" />
            Upload {config.label}
          </CardTitle>
          <CardDescription className="text-blue-200">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-400 bg-blue-500/10' 
                : 'border-white/20 hover:border-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {dragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-blue-200 mb-4">
              or click to browse your files
            </p>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              disabled={uploading || files.length >= maxFiles}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              multiple={maxFiles > 1}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <div className="mt-4 text-sm text-blue-300">
              <p>Max file size: {Math.round(config.maxSize / (1024 * 1024))}MB</p>
              <p>Max files: {maxFiles}</p>
            </div>
          </div>

          {/* Selected Files Queue */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Selected Files ({files.length})</h4>
              <div className="space-y-3">
                {files.map((fileObj) => {
                  const progress = uploadProgress[fileObj.id] || 0
                  const hasError = progress === -1
                  
                  return (
                    <div key={fileObj.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {fileObj.preview ? (
                            <img 
                              src={fileObj.preview} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <File className="h-12 w-12 text-blue-400" />
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">{fileObj.file.name}</p>
                            <p className="text-blue-300 text-xs">{formatFileSize(fileObj.file.size)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {progress > 0 && progress < 100 && (
                            <Badge className="bg-blue-500/20 text-blue-200">
                              {progress}%
                            </Badge>
                          )}
                          {progress === 100 && (
                            <Badge className="bg-green-500/20 text-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                          {hasError && (
                            <Badge className="bg-red-500/20 text-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          
                          {!uploading && (
                            <Button
                              onClick={() => removeFile(fileObj.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {progress > 0 && progress < 100 && (
                        <Progress value={progress} className="w-full h-2" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || files.length === 0}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {files.length} File{files.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {showFileList && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <File className="h-5 w-5 mr-2" />
                Uploaded Files
              </div>
              <Badge className="bg-blue-500/20 text-blue-200">
                {uploadedFiles.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-blue-200">
              Manage your uploaded {config.label.toLowerCase()}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <File className="h-12 w-12 text-blue-400 mx-auto mb-3 opacity-50" />
                <p className="text-blue-200">No files uploaded yet</p>
                <p className="text-blue-300 text-sm">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {file.mimeType?.startsWith('image/') ? (
                          <img 
                            src={file.url} 
                            alt="File preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <File className="h-12 w-12 text-blue-400" />
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{file.filename}</p>
                          <p className="text-blue-300 text-xs">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => window.open(file.url, '_blank')}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          onClick={() => deleteUploadedFile(file.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}