"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Video } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const upcomingMeetings = [
  {
    id: 1,
    title: "Coffee Chat with Sarah",
    time: "2:00 PM",
    date: "Today",
    company: "TechCorp",
    type: "coffee",
  },
  {
    id: 2,
    title: "Interview - Google",
    time: "10:00 AM",
    date: "Tomorrow",
    company: "Google",
    type: "interview",
  },
  {
    id: 3,
    title: "Networking Event",
    time: "6:00 PM",
    date: "Friday",
    company: "Various",
    type: "event",
  },
]

const suggestedSlots = [
  { day: "Monday", time: "2:00 PM - 3:00 PM", available: true },
  { day: "Tuesday", time: "11:00 AM - 12:00 PM", available: true },
  { day: "Wednesday", time: "3:00 PM - 4:00 PM", available: true },
  { day: "Thursday", time: "1:00 PM - 2:00 PM", available: true },
]

export function CalendarSidebar() {
  const [selectedSlot, setSelectedSlot] = useState("")
  const [meetingTitle, setMeetingTitle] = useState("Coffee Chat")
  const [meetingDescription, setMeetingDescription] = useState(
    "Looking forward to connecting and learning about your experience!",
  )

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto">
      {/* Upcoming Meetings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Upcoming Meetings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingMeetings.map((meeting) => (
            <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-sm text-gray-900">{meeting.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {meeting.type}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-1">{meeting.company}</p>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>
                  {meeting.date} at {meeting.time}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Time Slots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="h-5 w-5 text-green-600" />
            <span>Available Slots</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestedSlots.map((slot, index) => (
            <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-900">{slot.day}</p>
                  <p className="text-xs text-gray-600">{slot.time}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 text-xs">Free</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Propose Meeting Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Propose Meeting
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Coffee Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Meeting Title</label>
              <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Coffee Chat" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Time Slot</label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {suggestedSlots.map((slot, index) => (
                    <SelectItem key={index} value={`${slot.day} ${slot.time}`}>
                      {slot.day} - {slot.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Meeting description..."
                className="h-20"
              />
            </div>

            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <Video className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-900">Zoom link will be auto-generated</span>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" className="flex-1 bg-transparent">
                Save Draft
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Send Invite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
