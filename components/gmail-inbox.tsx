"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mail, Search, RefreshCw, Target } from "lucide-react"
import { gmailService, GmailMessage } from "@/lib/gmail-service"
import { companiesService, Company } from "@/lib/companies-service"
import { toast } from "sonner"

export function GmailInbox() {
  const [emails, setEmails] = useState<GmailMessage[]>([])
  const [filteredEmails, setFilteredEmails] = useState<GmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterByGoals, setFilterByGoals] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)

  useEffect(() => {
    checkGmailConnection()
    loadCompanies()
  }, [])

  // Filter emails when search query, filter toggle, or emails change
  useEffect(() => {
    filterEmails()
  }, [emails, searchQuery, filterByGoals, companies])

  const checkGmailConnection = async () => {
    try {
      const status = await gmailService.checkAuthStatus()
      setIsGmailConnected(status.authenticated)
      if (status.authenticated) {
        loadEmails()
      }
    } catch (err) {
      setIsGmailConnected(false)
    }
  }

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true)
      const loadedCompanies = await companiesService.getCompanies()
      setCompanies(loadedCompanies)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setCompaniesLoading(false)
    }
  }

  const loadEmails = async () => {
    try {
      setIsLoading(true)
      const emailList = await gmailService.getEmails(20)
      setEmails(emailList)
    } catch (err) {
      toast.error("Failed to load emails")
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to check if email is from goal domains
  const isFromGoalDomain = (email: GmailMessage): boolean => {
    if (companies.length === 0) return false

    const emailDomain = email.from.split('@')[1]?.toLowerCase()
    return companies.some(company =>
      company.domain.toLowerCase() === emailDomain
    )
  }

  const filterEmails = () => {
    let filtered = emails

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.snippet.toLowerCase().includes(query)
      )
    }

    // Apply goal domain filter
    if (filterByGoals) {
      filtered = filtered.filter(email => isFromGoalDomain(email))
    }

    setFilteredEmails(filtered)
  }

  if (!isGmailConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Connect your Gmail account to view emails</p>
            <Button onClick={checkGmailConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
      <Card className="shadow-sm h-full flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Gmail Inbox</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadEmails} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Search and Filter Controls */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
          {/* Email Count Info */}
          {!isLoading && emails.length > 0 && (
            <div className="text-sm text-gray-600 px-2">
              {filterByGoals || searchQuery ? (
                <>Showing {filteredEmails.length} of {emails.length} emails</>
              ) : (
                <>{emails.length} emails</>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading emails...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails in inbox</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {filterByGoals ?
                  "No emails from goal domains found" :
                  "No emails match your search"
                }
              </p>
              {filterByGoals && (
                <p className="text-sm text-gray-500 mt-2">
                  Try turning off the goal filter or add more companies to your goals
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredEmails.map((email) => (
                <div key={email.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {email.subject || '(No Subject)'}
                        </p>
                        {filterByGoals && isFromGoalDomain(email) && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Goal Domain
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{email.from}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {email.snippet}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}