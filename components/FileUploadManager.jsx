'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, Image, FileText, Trash2, Download, Eye, 
  Camera, Plus, Check, X, Loader2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function FileUploadManager({ fileType = 'profile', entityId = null, maxFiles = 10 }) {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchFiles()
    }
  }, [user, fileType, entityId])

  const fetchFiles = async () => {
    setLoading(true)
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
        setFiles(data.files || [])
      } else {
        console.error('Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    if (selectedFiles.length === 0) return

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
    const validFiles = selectedFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} not supported`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check total file limit
    if (files.length + validFiles.length > maxFiles) {
      toast.error(`Cannot upload more than ${maxFiles} files`)
      return
    }

    validFiles.forEach(file => uploadFile(file))
  }

  const uploadFile = async (file) => {
    setUploading(true)
    try {
      const token = await user.getIdToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)
      if (entityId) formData.append('entityId', entityId)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${file.name} uploaded successfully`)
        
        // Add new file to the list
        const newFile = {
          id: data.fileId,
          filename: file.name,
          fileType: fileType,
          mimeType: file.type,
          size: file.size,
          url: data.url,
          uploadedAt: new Date().toISOString()
        }
        
        setFiles(prev => [newFile, ...prev])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`Failed to upload ${file.name}: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-400" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-400" />
    } else {
      return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'profile':
        return 'Profile Images'
      case 'class':
        return 'Class Images'
      case 'studio':
        return 'Studio Images'
      default:
        return 'Files'
    }
  }

  const getFileTypeDescription = () => {
    switch (fileType) {
      case 'profile':
        return 'Upload your profile picture to personalize your account'
      case 'class':
        return 'Add images to showcase your class and attract students'
      case 'studio':
        return 'Upload images of your studio space and facilities'
      default:
        return 'Upload and manage your files'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            {getFileTypeLabel()}
          </CardTitle>
          <CardDescription className="text-blue-200">
            {getFileTypeDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-blue-400" />
                )}
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">
                  {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </h3>
                <p className="text-blue-200 text-sm">
                  Supports: JPEG, PNG, GIF, WebP, PDF (max 10MB each)
                </p>
                <p className="text-blue-300 text-xs mt-1">
                  Maximum {maxFiles} files • Current: {files.length}/{maxFiles}
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={uploading || files.length >= maxFiles}
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/plain"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-500/20 text-blue-200">
              {files.filter(f => f.mimeType.startsWith('image/')).length} Images
            </Badge>
            <Badge className="bg-green-500/20 text-green-200">
              {files.filter(f => f.mimeType === 'application/pdf').length} Documents
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-200">
              {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))} Total Size
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Uploaded Files ({files.length})</span>
            <Button
              onClick={fetchFiles}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-12 h-12 bg-white/10 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No files uploaded</h3>
              <p className="text-blue-200">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  {/* File Preview */}
                  <div className="flex-shrink-0">
                    {file.mimeType.startsWith('image/') ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <img 
                          src={file.url} 
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">
                      {file.filename}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-blue-200 text-xs">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-blue-300 text-xs">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                      <Badge 
                        className={`text-xs ${
                          file.mimeType.startsWith('image/') 
                            ? 'bg-blue-500/20 text-blue-200' 
                            : 'bg-gray-500/20 text-gray-200'
                        }`}
                      >
                        {file.mimeType.split('/')[1].toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {file.mimeType.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = file.url
                        a.download = file.filename
                        a.click()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-400/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Upload Guidelines</h3>
              <div className="space-y-2 text-sm text-blue-200">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>High-quality images attract more students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Use good lighting and clear photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Show your space, equipment, and atmosphere</span>
                </div>
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-400" />
                  <span>Avoid blurry, dark, or unprofessional images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-400" />
                  <span>No copyrighted or inappropriate content</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}