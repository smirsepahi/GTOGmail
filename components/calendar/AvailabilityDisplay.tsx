'use client'

import { useState, useEffect } from 'react'
import { calendarService, AvailabilitySlot, SchedulingPreferences } from '@/lib/calendar-service'
import { Clock, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface AvailabilityDisplayProps {
  preferences: SchedulingPreferences
  isConnected: boolean
}

export default function AvailabilityDisplay({ preferences, isConnected }: AvailabilityDisplayProps) {
  const [todaySlots, setTodaySlots] = useState<AvailabilitySlot[]>([])
  const [tomorrowSlots, setTomorrowSlots] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isConnected) {
      loadAvailability()
    }
  }, [isConnected, preferences])

  const loadAvailability = async () => {
    try {
      setIsLoading(true)
      setError('')

      const today = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get availability for today and tomorrow
      const [todayAvailability, tomorrowAvailability] = await Promise.all([
        calendarService.getAvailability(today.toISOString().split('T')[0], preferences),
        calendarService.getAvailability(tomorrow.toISOString().split('T')[0], preferences)
      ])

      setTodaySlots(todayAvailability)
      setTomorrowSlots(tomorrowAvailability)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load availability:', err)
      setError('Failed to load availability data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getAvailabilityStatus = (slots: AvailabilitySlot[]) => {
    const totalMinutes = slots.reduce((sum, slot) => sum + slot.duration, 0)
    if (totalMinutes === 0) return { status: 'busy', color: 'red', text: 'Fully Booked' }
    if (totalMinutes < 60) return { status: 'limited', color: 'yellow', text: 'Limited Availability' }
    return { status: 'available', color: 'green', text: 'Good Availability' }
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Calendar</h3>
          <p className="text-gray-600">Connect your Google Calendar to see real-time availability</p>
        </div>
      </div>
    )
  }

  const todayStatus = getAvailabilityStatus(todaySlots)
  const tomorrowStatus = getAvailabilityStatus(tomorrowSlots)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Availability</h3>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={loadAvailability}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Availability */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Today</h4>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-${todayStatus.color}-100 text-${todayStatus.color}-700`}>
              {todayStatus.status === 'available' ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {todayStatus.text}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : todaySlots.length > 0 ? (
            <div className="space-y-2">
              {todaySlots.map((slot, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </span>
                    <span className="text-sm text-green-700">
                      {formatDuration(slot.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-sm">No availability today</p>
            </div>
          )}
        </div>

        {/* Tomorrow's Availability */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Tomorrow</h4>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-${tomorrowStatus.color}-100 text-${tomorrowStatus.color}-700`}>
              {tomorrowStatus.status === 'available' ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {tomorrowStatus.text}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tomorrowSlots.length > 0 ? (
            <div className="space-y-2">
              {tomorrowSlots.map((slot, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </span>
                    <span className="text-sm text-blue-700">
                      {formatDuration(slot.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-sm">No availability tomorrow</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {todaySlots.reduce((sum, slot) => sum + slot.duration, 0)}m
            </p>
            <p className="text-sm text-gray-600">Available Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {tomorrowSlots.reduce((sum, slot) => sum + slot.duration, 0)}m
            </p>
            <p className="text-sm text-gray-600">Available Tomorrow</p>
          </div>
        </div>
      </div>
    </div>
  )
}
