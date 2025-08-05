'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// ✅ STANDARDIZED MODAL: Consistent modal structure
export default function StandardModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'default',
  className = ''
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`
        relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto
        bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md 
        border border-white/20 rounded-lg shadow-2xl
        ${className}
      `}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-white/70 mt-1">{description}</p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end space-x-3 p-6 border-t border-white/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}