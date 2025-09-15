'use client'

import { useState, useEffect } from 'react'
import { calendarService, CalendarEvent } from '@/lib/calendar-service'
import { Calendar, Clock, Users, MapPin, ExternalLink, RefreshCw, Video } from 'lucide-react'

interface UpcomingMeetingsProps {
  isConnected: boolean
}

export default function UpcomingMeetings({ isConnected }: UpcomingMeetingsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isConnected) {
      loadUpcomingEvents()
    }
  }, [isConnected])

  const loadUpcomingEvents = async () => {
    try {
      setIsLoading(true)
      setError('')

      const upcomingEvents = await calendarService.getUpcomingEvents(7)
      
      // Filter out all-day events and sort by start time
      const timedEvents = upcomingEvents
        .filter(event => event.start.dateTime) // Only events with specific times
        .sort((a, b) => {
          const aTime = new Date(a.start.dateTime!).getTime()
          const bTime = new Date(b.start.dateTime!).getTime()
          return aTime - bTime
        })

      setEvents(timedEvents)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load upcoming events:', err)
      setError('Failed to load upcoming meetings')
    } finally {
      setIsLoading(false)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (!event.start.dateTime) return ''
    
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime!)
    const now = new Date()
    
    // Check if it's today
    const isToday = start.toDateString() === now.toDateString()
    const isTomorrow = start.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    let dateStr = ''
    if (isToday) {
      dateStr = 'Today'
    } else if (isTomorrow) {
      dateStr = 'Tomorrow'
    } else {
      dateStr = start.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
    
    const timeStr = `${start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`
    
    return `${dateStr}, ${timeStr}`
  }

  const getEventStatus = (event: CalendarEvent) => {
    if (!event.start.dateTime) return { status: 'scheduled', color: 'blue' }
    
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime!)
    const now = new Date()
    
    if (now >= start && now <= end) {
      return { status: 'ongoing', color: 'green' }
    } else if (now > end) {
      return { status: 'completed', color: 'gray' }
    } else if (start.getTime() - now.getTime() <= 15 * 60 * 1000) { // Within 15 minutes
      return { status: 'starting-soon', color: 'yellow' }
    }
    
    return { status: 'scheduled', color: 'blue' }
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

  const getAttendeeCount = (event: CalendarEvent) => {
    return event.attendees?.length || 0
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Calendar</h3>
          <p className="text-gray-600">Connect your Google Calendar to see upcoming meetings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={loadUpcomingEvents}
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

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.slice(0, 10).map((event) => {
            const status = getEventStatus(event)
            const attendeeCount = getAttendeeCount(event)
            const isVideo = isVideoMeeting(event)
            
            return (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {event.summary || 'Untitled Event'}
                      </h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                        {status.status === 'ongoing' && 'Live'}
                        {status.status === 'starting-soon' && 'Starting Soon'}
                        {status.status === 'scheduled' && 'Scheduled'}
                        {status.status === 'completed' && 'Completed'}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatEventTime(event)}</span>
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
                      
                      {attendeeCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
          
          {events.length > 10 && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Showing 10 of {events.length} upcoming meetings
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h4>
          <p className="text-gray-600">Your calendar is clear for the next 7 days</p>
        </div>
      )}
    </div>
  )
}
