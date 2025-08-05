'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

// ✅ EXTRACTED: Staffing settings modal
export default function StaffingSettings({ 
  isOpen, 
  onClose, 
  settings, 
  tempSettings, 
  setTempSettings, 
  onSave, 
  submitting 
}) {
  if (!isOpen || !tempSettings) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">Staffing Settings</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Approval Settings */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Approval Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Require approval for swap requests</Label>
                  <p className="text-blue-200 text-sm">All instructor swap requests must be approved by studio management</p>
                </div>
                <Switch
                  checked={tempSettings.requireSwapApproval}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, requireSwapApproval: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Auto-approve qualified instructors</Label>
                  <p className="text-blue-200 text-sm">Automatically approve swaps between certified instructors</p>
                </div>
                <Switch
                  checked={tempSettings.autoApproveQualified}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, autoApproveQualified: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Coverage Settings */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Coverage Settings</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Minimum hours before class for coverage requests</Label>
                <Input
                  type="number"
                  value={tempSettings.minimumCoverageHours}
                  onChange={(e) => 
                    setTempSettings(prev => ({ ...prev, minimumCoverageHours: parseInt(e.target.value) }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  min="1"
                  max="72"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Send coverage alerts to all instructors</Label>
                  <p className="text-blue-200 text-sm">Notify all qualified instructors when coverage is needed</p>
                </div>
                <Switch
                  checked={tempSettings.notifyAllInstructors}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, notifyAllInstructors: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Notification Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Email notifications</Label>
                  <p className="text-blue-200 text-sm">Receive email alerts for staffing events</p>
                </div>
                <Switch
                  checked={tempSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">SMS notifications</Label>
                  <p className="text-blue-200 text-sm">Receive text alerts for urgent staffing needs</p>
                </div>
                <Switch
                  checked={tempSettings.smsNotifications}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Daily staffing summary</Label>
                  <p className="text-blue-200 text-sm">Daily email with staffing status and upcoming needs</p>
                </div>
                <Switch
                  checked={tempSettings.dailySummary}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, dailySummary: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {submitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}