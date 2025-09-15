'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { calendarService, SchedulingPreferences } from '@/lib/calendar-service'
import { Calendar, Clock, Settings, ExternalLink, Copy, Check } from 'lucide-react'

export default function CalendarConnection() {
  const { user, updateProfile } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [preferences, setPreferences] = useState<SchedulingPreferences>({
    timezone: 'America/New_York',
    workingHours: { start: '09:00', end: '17:00' },
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    meetingDuration: 30,
    bufferTime: 15
  })
  const [schedulingLink, setSchedulingLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkCalendarStatus()
  }, [])

  const checkCalendarStatus = async () => {
    try {
      const status = await calendarService.checkCalendarStatus()
      setIsConnected(status.connected)
      if (status.email) {
        setUserEmail(status.email)
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error)
    }
  }

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const response = await calendarService.connectCalendar()
      
      // Open Google Calendar auth in new window
      window.open(response.authUrl, '_blank', 'width=500,height=600')
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        try {
          const status = await calendarService.checkCalendarStatus()
          if (status.connected) {
            setIsConnected(true)
            setUserEmail(status.email || '')
            clearInterval(pollInterval)
            
            // Update user profile
            await updateProfile({ 
              isCalendarConnected: true,
              calendarEmail: status.email 
            })
          }
        } catch (err) {
          console.error('Poll failed:', err)
        }
      }, 2000)
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000)
      
    } catch (error) {
      console.error('Failed to connect calendar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSchedulingLink = async () => {
    try {
      setIsLoading(true)
      const response = await calendarService.createSchedulingLink(preferences)
      setSchedulingLink(response.url)
    } catch (error) {
      console.error('Failed to generate scheduling link:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(schedulingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Google Calendar</h2>
          <p className="text-gray-600">Manage your availability and schedule meetings</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Calendar</h3>
          <p className="text-gray-600 mb-6">
            Connect Google Calendar to automatically check availability and schedule meetings
          </p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">Calendar Connected</p>
              <p className="text-sm text-green-700">{userEmail}</p>
            </div>
          </div>

          {/* Scheduling Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Scheduling Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={preferences.workingHours.start}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      workingHours: { ...preferences.workingHours, start: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="self-center text-gray-500">to</span>
                  <input
                    type="time"
                    value={preferences.workingHours.end}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      workingHours: { ...preferences.workingHours, end: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Duration
                </label>
                <select
                  value={preferences.meetingDuration}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    meetingDuration: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days
              </label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => {
                      const newDays = preferences.workingDays.includes(index)
                        ? preferences.workingDays.filter(d => d !== index)
                        : [...preferences.workingDays, index].sort()
                      setPreferences({ ...preferences, workingDays: newDays })
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      preferences.workingDays.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Scheduling Link */}
          <div>
            <button
              onClick={generateSchedulingLink}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              Generate Availability Link
            </button>

            {schedulingLink && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Scheduling Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schedulingLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this link with contacts to let them book time with you
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
