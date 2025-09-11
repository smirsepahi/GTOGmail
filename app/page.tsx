"use client"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TopNavigation } from "@/components/top-navigation"
import { EmailWorkspace } from "@/components/email-workspace"
import { AutomatedReachout } from "@/components/automated-reachout"
import { CalendarSidebar } from "@/components/calendar-sidebar"
import { ActivityPanel } from "@/components/activity-panel"
import { Dashboard } from "@/components/dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InboxView } from "@/components/inbox-view"
import { GmailAuth } from "@/components/gmail-auth"
import { GmailInbox } from "@/components/gmail-inbox"
import { EmailProviderAuth } from "@/components/email-provider-auth"
import { CompanyManagement } from "@/components/company-management"
import { gmailService } from "@/lib/gmail-service"
import { emailService, EmailProvider } from "@/lib/email-service"
import AuthGuard from "@/components/auth/AuthGuard"
import ProfileDropdown from "@/components/profile/ProfileDropdown"

export default function Home() {
  const [activeTab, setActiveTab] = useState("compose")
  const [isEmailConnected, setIsEmailConnected] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<EmailProvider | null>(null)

  useEffect(() => {
    checkEmailConnections()
  }, [])

  const checkEmailConnections = async () => {
    try {
      const connectedProviders = await emailService.getConnectedProviders()
      if (connectedProviders.length > 0) {
        setIsEmailConnected(true)
        setCurrentProvider(connectedProviders[0])
        emailService.setProvider(connectedProviders[0])
      } else {
        setIsEmailConnected(false)
        setCurrentProvider(null)
      }
    } catch (err) {
      setIsEmailConnected(false)
      setCurrentProvider(null)
    }
  }

  const handleAuthChange = (provider: EmailProvider, authenticated: boolean) => {
    if (authenticated) {
      setIsEmailConnected(true)
      setCurrentProvider(provider)
    } else {
      // Check if any other providers are still connected
      checkEmailConnections()
    }
  }

  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true} style={{ "--sidebar-width": "20rem" }}>
        <div className="min-h-screen bg-gray-50">
          <TopNavigation />

        <div className="flex h-[calc(100vh-64px)]">
          {/* Calendar Sidebar */}
          <CalendarSidebar />

          {/* Main Content */}
          <div className="flex flex-col" style={{ width: 'calc(100vw - 320px)' }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b bg-white px-6 py-3">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="compose">Automated Reachout</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                </TabsList>
              </div>

              {/* Email Accounts Tab */}
              <TabsContent value="accounts" className="flex-1 p-6">
                <EmailProviderAuth onAuthChange={handleAuthChange} />
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="flex-1 p-6">
                <CompanyManagement />
              </TabsContent>

              {/* Dashboard - Full Width */}
              {activeTab === "dashboard" && (
                <div className="flex-1 flex w-full">
                  <Dashboard />
                </div>
              )}

              {/* Automated Reachout - Full Width */}
              {activeTab === "compose" && (
                <div className="flex-1 flex w-full">
                  <AutomatedReachout isEmailConnected={isEmailConnected} />
                </div>
              )}

              {/* Inbox - With Activity Panel */}
              {activeTab === "inbox" && (
                <div className="flex-1 flex w-full">
                  <GmailInbox />
                  <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                    <ActivityPanel />
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
    </AuthGuard>
  )
}
