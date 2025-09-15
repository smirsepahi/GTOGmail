'use client'

import { useState, useEffect } from 'react'
import { calendarService, CalendarEvent } from '@/lib/calendar-service'
import { Clock, Calendar, Users, MapPin, Video, RefreshCw } from 'lucide-react'

interface TodaysScheduleProps {
  isConnected: boolean
}

export default function TodaysSchedule({ isConnected }: TodaysScheduleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isConnected) {
      loadTodaysEvents()
      
      // Refresh every 5 minutes
      const interval = setInterval(loadTodaysEvents, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const loadTodaysEvents = async () => {
    try {
      setIsLoading(true)
      setError('')

      const todaysEvents = await calendarService.getTodaysEvents()
      
      // Filter and sort events
      const timedEvents = todaysEvents
        .filter(event => event.start.dateTime) // Only timed events
        .sort((a, b) => {
          const aTime = new Date(a.start.dateTime!).getTime()
          const bTime = new Date(b.start.dateTime!).getTime()
          return aTime - bTime
        })

      setEvents(timedEvents)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load today\'s events:', err)
      setError('Failed to load today\'s schedule')
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

  const getEventStatus = (event: CalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return 'scheduled'
    
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    const now = new Date()
    
    if (now >= start && now <= end) {
      return 'ongoing'
    } else if (now > end) {
      return 'completed'
    } else if (start.getTime() - now.getTime() <= 15 * 60 * 1000) {
      return 'starting-soon'
    }
    
    return 'scheduled'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-200'
      case 'starting-soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Live Now'
      case 'starting-soon': return 'Starting Soon'
      case 'completed': return 'Completed'
      default: return 'Scheduled'
    }
  }

  const isVideoMeeting = (event: CalendarEvent) => {
    const description = event.description?.toLowerCase() || ''
    const location = event.location?.toLowerCase() || ''
    
    return description.includes('zoom') || 
           description.includes('meet.google.com') || 
           description.includes('teams') ||
           location.includes('zoom') ||
           location.includes('meet.google.com') ||
           location.includes('teams')
  }

  const getNextEvent = () => {
    const now = new Date()
    return events.find(event => {
      if (!event.start.dateTime) return false
      return new Date(event.start.dateTime) > now
    })
  }

  const getCurrentEvent = () => {
    const now = new Date()
    return events.find(event => {
      if (!event.start.dateTime || !event.end.dateTime) return false
      const start = new Date(event.start.dateTime)
      const end = new Date(event.end.dateTime)
      return now >= start && now <= end
    })
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Calendar</h3>
          <p className="text-gray-600">Connect your Google Calendar to see today's schedule</p>
        </div>
      </div>
    )
  }

  const currentEvent = getCurrentEvent()
  const nextEvent = getNextEvent()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadTodaysEvents}
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

      {/* Current/Next Event Highlight */}
      {(currentEvent || nextEvent) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          {currentEvent ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Currently in meeting</span>
              </div>
              <h4 className="font-semibold text-gray-900">{currentEvent.summary}</h4>
              <p className="text-sm text-gray-600">
                Until {formatTime(currentEvent.end.dateTime!)}
              </p>
            </div>
          ) : nextEvent ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Next meeting</span>
              </div>
              <h4 className="font-semibold text-gray-900">{nextEvent.summary}</h4>
              <p className="text-sm text-gray-600">
                {formatTime(nextEvent.start.dateTime!)} - {formatTime(nextEvent.end.dateTime!)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => {
            const status = getEventStatus(event)
            const isVideo = isVideoMeeting(event)
            
            return (
              <div 
                key={event.id} 
                className={`p-4 border rounded-lg transition-all ${
                  status === 'ongoing' ? 'ring-2 ring-green-200 bg-green-50' : 
                  status === 'starting-soon' ? 'ring-2 ring-yellow-200 bg-yellow-50' :
                  'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {event.summary || 'Untitled Event'}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(event.start.dateTime!)} - {formatTime(event.end.dateTime!)}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-2">
                          {isVideo ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No meetings today</h4>
          <p className="text-gray-600">You have a clear schedule today!</p>
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 5 minutes
          </p>
        </div>
      )}
    </div>
  )
}
