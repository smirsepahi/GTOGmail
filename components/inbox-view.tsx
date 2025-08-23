"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search, Filter, Mail, MailOpen, Archive, Tag, Reply, Sparkles, Send, Target } from "lucide-react"
import { companiesService, Company } from "@/lib/companies-service"
import { toast } from "sonner"

const mockEmails = [
  {
    id: 1,
    sender: "Sarah Johnson",
    senderEmail: "sarah@techcorp.com",
    subject: "Re: Coffee Chat Follow-up",
    snippet:
      "Thank you so much for the coffee chat yesterday! I really enjoyed our conversation about the internship program...",
    date: "2 hours ago",
    isRead: false,
    labels: ["Coffee Chat"],
    thread: [
      {
        id: 1,
        from: "you@email.com",
        to: "sarah@techcorp.com",
        subject: "Coffee Chat Follow-up",
        body: "Hi Sarah,\n\nThank you for taking the time to meet with me yesterday. I really enjoyed our conversation about the software engineering internship program at TechCorp.\n\nI'm very excited about the opportunity to contribute to your team's innovative projects. As we discussed, I'll send over my portfolio and the project we talked about.\n\nLooking forward to hearing about next steps!\n\nBest regards,\nAlex",
        timestamp: "Yesterday 3:00 PM",
        isFromUser: true,
      },
      {
        id: 2,
        from: "sarah@techcorp.com",
        to: "you@email.com",
        subject: "Re: Coffee Chat Follow-up",
        body: "Hi Alex,\n\nThank you so much for the coffee chat yesterday! I really enjoyed our conversation about the internship program and was impressed by your enthusiasm and technical background.\n\nI've shared your information with our hiring team, and we'd love to move forward with a technical interview. Are you available next week for a 1-hour technical session?\n\nPlease let me know your availability, and I'll send over the calendar invite.\n\nBest,\nSarah Johnson\nSenior Software Engineer\nTechCorp",
        timestamp: "2 hours ago",
        isFromUser: false,
      },
    ],
  },
  {
    id: 2,
    sender: "Google Careers",
    senderEmail: "careers@google.com",
    subject: "Your Application Status Update",
    snippet:
      "We wanted to provide you with an update on your application for the Software Engineering Intern position...",
    date: "1 day ago",
    isRead: true,
    labels: ["Application", "Google"],
    thread: [
      {
        id: 1,
        from: "careers@google.com",
        to: "you@email.com",
        subject: "Your Application Status Update",
        body: "Dear Alex,\n\nWe wanted to provide you with an update on your application for the Software Engineering Intern position at Google.\n\nWe've reviewed your application and are impressed with your background. We'd like to invite you to participate in our technical phone screening.\n\nThe interview will be approximately 45 minutes and will focus on coding and problem-solving. Please reply with your availability for the next two weeks.\n\nBest regards,\nGoogle Recruiting Team",
        timestamp: "1 day ago",
        isFromUser: false,
      },
    ],
  },
  {
    id: 3,
    sender: "John Smith",
    senderEmail: "john@startup.io",
    subject: "Great meeting you at the career fair!",
    snippet:
      "It was wonderful connecting with you at yesterday's career fair. I was impressed by your passion for AI...",
    date: "3 days ago",
    isRead: true,
    labels: ["Networking", "Career Fair"],
    thread: [
      {
        id: 1,
        from: "john@startup.io",
        to: "you@email.com",
        subject: "Great meeting you at the career fair!",
        body: "Hi Alex,\n\nIt was wonderful connecting with you at yesterday's career fair. I was impressed by your passion for AI and machine learning projects.\n\nI'd love to schedule a time to chat more about potential opportunities at our startup. We're always looking for talented interns who are excited about cutting-edge technology.\n\nWould you be interested in grabbing coffee next week?\n\nBest,\nJohn Smith\nCTO, StartupXYZ",
        timestamp: "3 days ago",
        isFromUser: false,
      },
    ],
  },
  {
    id: 4,
    sender: "Microsoft Recruiting",
    senderEmail: "recruiting@microsoft.com",
    subject: "Thank you for your interest in Microsoft",
    snippet:
      "Thank you for applying to our Software Engineering Internship program. We have received your application...",
    date: "5 days ago",
    isRead: true,
    labels: ["Application", "Microsoft"],
    thread: [
      {
        id: 1,
        from: "recruiting@microsoft.com",
        to: "you@email.com",
        subject: "Thank you for your interest in Microsoft",
        body: "Dear Alex,\n\nThank you for applying to our Software Engineering Internship program. We have received your application and our team is currently reviewing it.\n\nWe receive a large number of applications and our review process typically takes 2-3 weeks. We will contact you with updates as they become available.\n\nThank you for your patience and interest in Microsoft.\n\nBest regards,\nMicrosoft University Recruiting",
        timestamp: "5 days ago",
        isFromUser: false,
      },
    ],
  },
  {
    id: 6,
    sender: "McKinsey Recruiting",
    senderEmail: "recruiting@mckinsey.com",
    subject: "Summer Analyst Program - Next Steps",
    snippet:
      "Thank you for your interest in McKinsey's Summer Analyst Program. We'd like to schedule your first round interview...",
    date: "3 hours ago",
    isRead: false,
    labels: ["Application"],
    thread: [
      {
        id: 11,
        from: "recruiting@mckinsey.com",
        to: "you@email.com",
        subject: "Summer Analyst Program - Next Steps",
        body: "Dear Candidate,\n\nThank you for your interest in McKinsey's Summer Analyst Program. We've reviewed your application and would like to move forward with the interview process.\n\nWe'd like to schedule your first round interview for next week. This will be a case interview with one of our consultants.\n\nPlease let us know your availability.\n\nBest regards,\nMcKinsey Recruiting Team",
        timestamp: "3 hours ago",
        isFromUser: false,
      },
    ],
  },
  {
    id: 7,
    sender: "Bain & Company",
    senderEmail: "careers@bain.com",
    subject: "Coffee Chat Invitation",
    snippet:
      "Hi! I saw your profile and would love to chat about opportunities at Bain. Are you available for a coffee chat next week?",
    date: "5 hours ago",
    isRead: false,
    labels: ["Coffee Chat"],
    thread: [
      {
        id: 12,
        from: "careers@bain.com",
        to: "you@email.com",
        subject: "Coffee Chat Invitation",
        body: "Hi there,\n\nI saw your profile on LinkedIn and was impressed by your background. I'm a consultant at Bain & Company and would love to chat about opportunities here.\n\nWould you be available for a coffee chat next week? I'd be happy to share more about our culture and the work we do.\n\nLet me know what works for you!\n\nBest,\nJessica Chen\nConsultant, Bain & Company",
        timestamp: "5 hours ago",
        isFromUser: false,
      },
    ],
  },
]

const filterOptions = [
  { value: "all", label: "All Emails" },
  { value: "unread", label: "Unread" },
  { value: "coffee-chat", label: "Coffee Chat" },
  { value: "application", label: "Applications" },
  { value: "last-7-days", label: "Last 7 Days" },
]

const tagColors: Record<string, string> = {
  "Coffee Chat": "bg-blue-100 text-blue-800",
  Application: "bg-purple-100 text-purple-800",
  Networking: "bg-orange-100 text-orange-800",
  "Career Fair": "bg-pink-100 text-pink-800",
  Google: "bg-red-100 text-red-800",
  Microsoft: "bg-blue-100 text-blue-800",
}

export function InboxView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedEmail, setSelectedEmail] = useState<(typeof mockEmails)[0] | null>(null)
  const [replyText, setReplyText] = useState("")
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [filterByGoals, setFilterByGoals] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)

  // Load companies on component mount
  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const loadedCompanies = await companiesService.getCompanies()
      setCompanies(loadedCompanies)
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if email is from goal domains
  const isFromGoalDomain = (email: any): boolean => {
    if (companies.length === 0) return false

    const emailDomain = email.senderEmail.split('@')[1]?.toLowerCase()
    return companies.some(company =>
      company.domain.toLowerCase() === emailDomain
    )
  }

  const filteredEmails = mockEmails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unread" && !email.isRead) ||
      (selectedFilter === "coffee-chat" && email.labels.includes("Coffee Chat")) ||
      (selectedFilter === "application" && email.labels.includes("Application")) ||
      (selectedFilter === "last-7-days" && true) // Simplified for demo

    const matchesGoalFilter = !filterByGoals || isFromGoalDomain(email)

    return matchesSearch && matchesFilter && matchesGoalFilter
  })

  const generateAIReply = () => {
    // AI reply generation temporarily disabled to save costs
    console.log("AI reply generation disabled")
    // const suggestions = [
    //   "Thank you for your email! I'm very excited about this opportunity and would love to schedule the technical interview. I'm available next week on Tuesday, Wednesday, or Thursday afternoon. Please let me know what works best for your team.",
    //   "I appreciate you reaching out! I'm definitely interested in learning more about the position. I'm available for a coffee chat next week - would Tuesday or Wednesday morning work for you?",
    //   "Thank you for the update! I'm very interested in moving forward with the process. I'm available for the phone screening anytime next week except Friday. Looking forward to hearing from you.",
    // ]
    // const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    // setAiSuggestion(randomSuggestion)
    // setReplyText(randomSuggestion)
  }

  const markAsRead = (emailId: number) => {
    // In real app, this would update the email status
    console.log("Marking email as read:", emailId)
  }

  const archiveEmail = (emailId: number) => {
    // In real app, this would archive the email
    console.log("Archiving email:", emailId)
  }

  const addTag = (emailId: number, tag: string) => {
    // In real app, this would add a tag to the email
    console.log("Adding tag to email:", emailId, tag)
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Email List */}
      <div className="w-1/3 min-w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal Domain Filter */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <Label htmlFor="goal-filter" className="text-sm font-medium text-blue-900">
                Show only goal domains
              </Label>
              {companies.length === 0 && (
                <span className="text-xs text-gray-500">(No goals set)</span>
              )}
              {filterByGoals && companies.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Filtering by {companies.length} domain{companies.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Switch
              id="goal-filter"
              checked={filterByGoals}
              onCheckedChange={setFilterByGoals}
              disabled={companies.length === 0}
            />
          </div>

          {filterByGoals && companies.length > 0 && (
            <div className="text-xs text-blue-700 px-2">
              Showing emails from: {companies.map(c => c.domain).join(', ')}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedEmail?.id === email.id ? "bg-blue-50 border-blue-200" : ""
              } ${!email.isRead ? "bg-blue-25" : ""}`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {email.isRead ? (
                    <MailOpen className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-600" />
                  )}
                  <span className={`font-medium ${!email.isRead ? "text-gray-900" : "text-gray-700"}`}>
                    {email.sender}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{email.date}</span>
              </div>

              <h3 className={`text-sm mb-1 ${!email.isRead ? "font-semibold text-gray-900" : "text-gray-800"}`}>
                {email.subject}
              </h3>

              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{email.snippet}</p>

              <div className="flex flex-wrap gap-1">
                {email.labels.map((label) => (
                  <Badge key={label} className={`text-xs ${tagColors[label] || "bg-gray-100 text-gray-800"}`}>
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedEmail.subject}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>From: {selectedEmail.sender} &lt;{selectedEmail.senderEmail}&gt;</span>
                    <span>Date: {selectedEmail.date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(selectedEmail.id, "Follow-up")}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveEmail(selectedEmail.id)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>
              </div>
            </div>

            {/* Email Thread */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {selectedEmail.thread.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${
                      message.isFromUser
                        ? "bg-blue-50 border-blue-200 ml-8"
                        : "bg-gray-50 border-gray-200 mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {message.isFromUser ? "You" : selectedEmail.sender}
                        </span>
                        <span className="text-sm text-gray-500">to</span>
                        <span className="font-medium text-gray-900">
                          {message.isFromUser ? selectedEmail.senderEmail : "you@email.com"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{message.timestamp}</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-700">{message.body}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Section */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reply</h3>
                <Button onClick={generateAIReply} variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Reply
                </Button>
              </div>

              {aiSuggestion && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>AI Suggestion:</strong> {aiSuggestion}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-32"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTag(selectedEmail.id, "Replied")}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Mark as Replied
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Save Draft
                    </Button>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <Mail className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4 leading-relaxed">Select an email to read</h3>
              <p className="text-gray-500 text-base leading-relaxed">Choose an email from the list to view its content and reply.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
