"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Send, Sparkles, RefreshCw, Edit3, Check, Mail, AlertCircle } from "lucide-react"
import { gmailService } from "@/lib/gmail-service"
import { emailService } from "@/lib/email-service"
import { toast } from "sonner"

const toneOptions = [
  { value: "formal", label: "Formal", color: "bg-blue-100 text-blue-800" },
  { value: "friendly", label: "Friendly", color: "bg-green-100 text-green-800" },
  { value: "direct", label: "Direct", color: "bg-orange-100 text-orange-800" },
]

const aiSuggestions = [
  "I hope this email finds you well. I'm reaching out to express my strong interest in internship opportunities at your company.",
  "Thank you for taking the time to connect with me at the career fair. I was impressed by our conversation about your team's innovative projects.",
  "I would love to schedule a brief coffee chat to learn more about your experience and discuss potential opportunities.",
]

interface EmailWorkspaceProps {
  isEmailConnected: boolean
}

export function EmailWorkspace({ isEmailConnected }: EmailWorkspaceProps) {
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedTone, setSelectedTone] = useState("friendly")
  const [aiDraft, setAiDraft] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [detectedTone, setDetectedTone] = useState("friendly")
  const [isSending, setIsSending] = useState(false)

  // AI tone detection temporarily disabled to save costs
  useEffect(() => {
    // Disabled AI tone detection
    console.log("AI tone detection disabled")
    // if (recipient.includes("@")) {
    //   const domain = recipient.split("@")[1]
    //   if (domain?.includes("gov") || domain?.includes("edu")) {
    //     setDetectedTone("formal")
    //   } else if (domain?.includes("startup") || domain?.includes("tech")) {
    //     setDetectedTone("direct")
    //   } else {
    //     setDetectedTone("friendly")
    //   }
    // }
  }, [recipient])

  const generateAIDraft = () => {
    // AI functionality temporarily disabled to save costs
    console.log("AI draft generation disabled")
    // const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)]
    // setAiDraft(randomSuggestion)
    // setShowSuggestions(true)
  }

  const acceptDraft = () => {
    setBody(aiDraft)
    setShowSuggestions(false)
  }

  const handleSendEmail = async () => {
    if (!isEmailConnected) {
      toast.error("Please connect an email account first")
      return
    }

    if (!recipient || !subject || !body) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setIsSending(true)

      await emailService.sendEmail({
        to: recipient,
        subject: subject,
        body: body,
        isHtml: false
      })

      const provider = emailService.getCurrentProvider()
      toast.success(`Email sent successfully via ${provider?.charAt(0).toUpperCase()}${provider?.slice(1)}!`)

      // Clear form
      setRecipient("")
      setSubject("")
      setBody("")
      setShowSuggestions(false)

    } catch (err) {
      console.error("Failed to send email:", err)
      toast.error("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const currentTone = toneOptions.find((tone) => tone.value === detectedTone)

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
      <Card className="shadow-sm h-full flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>AI-Powered Email Composer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Email Connection Status */}
          {!isEmailConnected && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Connect an email account to send emails
              </span>
            </div>
          )}

          {/* Recipient and Subject */}
          <div className="space-y-3 flex-shrink-0">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
              <Input
                placeholder="recipient@company.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <Input
                placeholder="Internship Inquiry - [Your Name]"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Tone Detection and Selection */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Detected Tone:</span>
              <Badge className={currentTone?.color}>{currentTone?.label}</Badge>
            </div>

            <Select value={selectedTone} onValueChange={setSelectedTone}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Adjust tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    {tone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Body */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-sm font-medium text-gray-700 mb-1 block flex-shrink-0">Message</label>
            <Textarea
              placeholder="Start typing your email..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px] resize-none flex-1"
            />
          </div>

          {/* AI Suggestions */}
          {showSuggestions && (
            <Card className="bg-blue-50 border-blue-200 flex-shrink-0">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-sm font-medium text-blue-900">AI Suggestion</span>
                </div>
                <p className="text-sm text-gray-700 mb-4">{aiDraft}</p>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={acceptDraft} className="bg-blue-600 hover:bg-blue-700">
                    <Check className="h-4 w-4 mr-1" />
                    Accept Draft
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBody(aiDraft)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={generateAIDraft}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 flex-shrink-0">
            <Button variant="outline" onClick={generateAIDraft}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Draft
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline">Save Draft</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendEmail}
                disabled={!isEmailConnected || isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
