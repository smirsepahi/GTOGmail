"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, LogOut, User, CheckCircle, AlertCircle } from "lucide-react"
import { gmailService, GmailProfile } from "@/lib/gmail-service"

interface GmailAuthProps {
  onAuthChange?: (authenticated: boolean) => void
}

export function GmailAuth({ onAuthChange }: GmailAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authUrl, setAuthUrl] = useState("")
  const [profile, setProfile] = useState<GmailProfile | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const status = await gmailService.checkAuthStatus()
      setIsAuthenticated(status.authenticated)
      
      if (status.authenticated) {
        await loadProfile()
      }
      
      onAuthChange?.(status.authenticated)
    } catch (err) {
      console.error("Auth check failed:", err)
      setError("Failed to check authentication status")
    } finally {
      setIsLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      const userProfile = await gmailService.getProfile()
      setProfile(userProfile)
    } catch (err) {
      console.error("Failed to load profile:", err)
      setError("Failed to load Gmail profile")
    }
  }

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await gmailService.getAuthUrl()
      setAuthUrl(response.authUrl)
      
      // Open the auth URL in a new window
      window.open(response.authUrl, "_blank", "width=500,height=600")
      
      // Poll for authentication status
      const pollInterval = setInterval(async () => {
        try {
          const status = await gmailService.checkAuthStatus()
          if (status.authenticated) {
            setIsAuthenticated(true)
            await loadProfile()
            onAuthChange?.(true)
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error("Poll failed:", err)
        }
      }, 2000)
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 300000)
      
    } catch (err) {
      console.error("Failed to get auth URL:", err)
      setError("Failed to connect to Gmail")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      await gmailService.logout()
      setIsAuthenticated(false)
      setProfile(null)
      setAuthUrl("")
      
      onAuthChange?.(false)
    } catch (err) {
      console.error("Failed to logout:", err)
      setError("Failed to disconnect from Gmail")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Checking connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to access emails and send messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Connected to Gmail</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>

            {profile && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{profile.emailAddress}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {profile.messagesTotal} messages • {profile.threadsTotal} threads
                </div>
              </div>
            )}

            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Gmail
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-800">Not connected to Gmail</span>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Disconnected
              </Badge>
            </div>

            <Button
              onClick={handleConnect}
              className="w-full"
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail Account
            </Button>

            <p className="text-xs text-gray-600 text-center">
              Click to connect your Gmail account. You'll be redirected to Google to authorize access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 