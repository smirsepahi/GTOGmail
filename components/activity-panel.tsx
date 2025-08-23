"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Sparkles, Eye, Clock } from "lucide-react"

const recentEmails = [
  {
    id: 1,
    to: "sarah@techcorp.com",
    subject: "Coffee Chat Follow-up",
    preview: "Thank you for the insightful conversation...",
    time: "2 hours ago",
    tags: ["Coffee Chat", "Follow-up"],
    status: "sent",
  },
  {
    id: 2,
    to: "recruiter@google.com",
    subject: "Software Engineering Internship Application",
    preview: "I am writing to express my strong interest...",
    time: "1 day ago",
    tags: ["Application", "Google"],
    status: "sent",
  },
  {
    id: 3,
    to: "john@startup.io",
    subject: "Networking Connection",
    preview: "It was great meeting you at the career fair...",
    time: "3 days ago",
    tags: ["Networking", "Career Fair"],
    status: "sent",
  },
]

const aiDrafts = [
  {
    id: 1,
    to: "hiring@microsoft.com",
    subject: "Internship Inquiry - Computer Science Student",
    preview: "I hope this email finds you well. I am a junior...",
    time: "1 hour ago",
    tags: ["Application", "Microsoft"],
    status: "draft",
  },
  {
    id: 2,
    to: "team@openai.com",
    subject: "Research Internship Opportunity",
    preview: "I am reaching out to inquire about potential...",
    time: "4 hours ago",
    tags: ["Research", "AI"],
    status: "draft",
  },
]

const tagColors: Record<string, string> = {
  "Coffee Chat": "bg-blue-100 text-blue-800",
  "Follow-up": "bg-green-100 text-green-800",
  Application: "bg-purple-100 text-purple-800",
  Networking: "bg-orange-100 text-orange-800",
  "Career Fair": "bg-pink-100 text-pink-800",
  Research: "bg-indigo-100 text-indigo-800",
  Google: "bg-red-100 text-red-800",
  Microsoft: "bg-blue-100 text-blue-800",
  AI: "bg-gray-100 text-gray-800",
}

export function ActivityPanel() {
  const [showAIDraft, setShowAIDraft] = useState<number | null>(null)

  return (
    <div className="bg-white border-l border-gray-200 p-4 overflow-y-auto" style={{ width: '266px' }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Mail className="h-5 w-5 text-gray-600" />
            <span>Email Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sent">Recent Sent</TabsTrigger>
              <TabsTrigger value="drafts">AI Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="space-y-3 mt-4">
              {recentEmails.map((email) => (
                <div key={email.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{email.subject}</p>
                      <p className="text-xs text-gray-600 truncate">To: {email.to}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{email.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-2">{email.preview}</p>

                  <div className="flex flex-wrap gap-1">
                    {email.tags.map((tag) => (
                      <Badge key={tag} className={`text-xs ${tagColors[tag] || "bg-gray-100 text-gray-800"}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-3 mt-4">
              {aiDrafts.map((draft) => (
                <div key={draft.id} className="p-3 bg-blue-50 rounded-lg space-y-2 border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-1">
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        <p className="font-medium text-sm text-gray-900 truncate">{draft.subject}</p>
                      </div>
                      <p className="text-xs text-gray-600 truncate">To: {draft.to}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{draft.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-2">{draft.preview}</p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {draft.tags.map((tag) => (
                      <Badge key={tag} className={`text-xs ${tagColors[tag] || "bg-gray-100 text-gray-800"}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 bg-transparent"
                      onClick={() => setShowAIDraft(showAIDraft === draft.id ? null : draft.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {showAIDraft === draft.id ? "Hide" : "View"}
                    </Button>
                    <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700">
                      Use Draft
                    </Button>
                  </div>

                  {showAIDraft === draft.id && (
                    <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-700">
                      {draft.preview}... [Full AI-generated content would appear here]
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
