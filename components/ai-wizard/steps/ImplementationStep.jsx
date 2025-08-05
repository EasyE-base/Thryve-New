'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

// ✅ EXTRACTED: Implementation step with progress tracking
export default function ImplementationStep({ loading, isCompleted, onComplete }) {
  const [implementationProgress, setImplementationProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState(0)

  const implementationTasks = [
    { name: 'Creating studio profile', duration: 2000 },
    { name: 'Setting up class schedules', duration: 3000 },
    { name: 'Configuring pricing models', duration: 2500 },
    { name: 'Implementing policies', duration: 2000 },
    { name: 'Setting up payment processing', duration: 3500 },
    { name: 'Configuring integrations', duration: 2000 },
    { name: 'Finalizing studio dashboard', duration: 1500 }
  ]

  // ✅ EFFECT: Simulate implementation progress
  useEffect(() => {
    if (loading && !isCompleted) {
      let taskIndex = 0
      let progress = 0

      const runTask = () => {
        if (taskIndex < implementationTasks.length) {
          setCurrentTask(taskIndex)
          
          const task = implementationTasks[taskIndex]
          const increment = 100 / implementationTasks.length
          
          const taskInterval = setInterval(() => {
            progress += increment / (task.duration / 100)
            setImplementationProgress(Math.min(progress, (taskIndex + 1) * increment))
          }, 100)

          setTimeout(() => {
            clearInterval(taskInterval)
            taskIndex++
            if (taskIndex < implementationTasks.length) {
              runTask()
            } else {
              setImplementationProgress(100)
              setTimeout(onComplete, 500)
            }
          }, task.duration)
        }
      }

      runTask()
    }
  }, [loading, isCompleted, onComplete])

  if (isCompleted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Implementation Complete!</h3>
        <p className="text-white/70 mb-6">Your studio configuration has been successfully applied</p>
        
        <Card className="bg-green-600/20 border-green-400/30 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-white">All systems configured</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!loading) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70">Click "Next" to start implementation</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
          <Clock className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Implementing Configuration</h3>
        <p className="text-white/70">Setting up your studio with the selected preferences</p>
      </div>

      {/* Progress */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-white/20 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${implementationProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-white/60 text-sm mt-2">
          <span>{Math.round(implementationProgress)}% complete</span>
          <span>~{Math.max(0, implementationTasks.length - currentTask - 1)} tasks remaining</span>
        </div>
      </div>

      {/* Task List */}
      <div className="max-w-lg mx-auto space-y-3">
        {implementationTasks.map((task, index) => (
          <div 
            key={index}
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
              index < currentTask 
                ? 'bg-green-600/20 border border-green-400/30' 
                : index === currentTask
                  ? 'bg-blue-600/20 border border-blue-400/30'
                  : 'bg-white/5 border border-white/10'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {index < currentTask ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : index === currentTask ? (
                <Clock className="h-5 w-5 text-blue-400 animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-white/30" />
              )}
            </div>
            <div className={`text-sm ${
              index < currentTask 
                ? 'text-green-300 font-medium' 
                : index === currentTask
                  ? 'text-white font-medium'
                  : 'text-white/60'
            }`}>
              {task.name}
            </div>
          </div>
        ))}
      </div>

      {/* Status Card */}
      <Card className="bg-blue-600/20 border-blue-400/30 max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-blue-400 font-medium mb-2">
            {currentTask < implementationTasks.length 
              ? implementationTasks[currentTask].name 
              : 'Finalizing setup...'
            }
          </div>
          <div className="text-white/70 text-sm">
            This process ensures your studio is configured correctly
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="max-w-md mx-auto">
        <div className="flex items-start p-4 bg-yellow-600/20 border border-yellow-400/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-yellow-200 text-sm">
            <div className="font-medium mb-1">Please don't close this page</div>
            <div>Implementation is in progress. Closing may cause setup issues.</div>
          </div>
        </div>
      </div>
    </div>
  )
}