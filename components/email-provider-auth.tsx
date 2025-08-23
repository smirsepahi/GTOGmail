"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { emailService, EmailProvider } from "@/lib/email-service"
import { toast } from "sonner"

interface EmailProviderAuthProps {
  onAuthChange?: (provider: EmailProvider, authenticated: boolean) => void
}

export function EmailProviderAuth({ onAuthChange }: EmailProviderAuthProps) {
  const [providers, setProviders] = useState<{
    gmail: { connected: boolean; loading: boolean; profile?: any }
    outlook: { connected: boolean; loading: boolean; profile?: any }
  }>({
    gmail: { connected: false, loading: false },
    outlook: { connected: false, loading: false }
  })

  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null)

  useEffect(() => {
    checkAllProviders()
  }, [])

  const checkAllProviders = async () => {
    const providerList: EmailProvider[] = ['gmail', 'outlook']

    for (const provider of providerList) {
      await checkProviderStatus(provider)
    }
  }

  const checkProviderStatus = async (provider: EmailProvider) => {
    try {
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: true }
      }))

      const status = await emailService.checkAuthStatus(provider)

      let profile = null
      if (status.authenticated) {
        try {
          emailService.setProvider(provider)
          profile = await emailService.getProfile()
        } catch (error) {
          console.error(`Failed to get ${provider} profile:`, error)
        }
      }

      setProviders(prev => ({
        ...prev,
        [provider]: {
          connected: status.authenticated,
          loading: false,
          profile
        }
      }))

      if (status.authenticated && !selectedProvider) {
        setSelectedProvider(provider)
        emailService.setProvider(provider)
      }

      onAuthChange?.(provider, status.authenticated)
    } catch (error) {
      console.error(`Failed to check ${provider} status:`, error)
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false, connected: false }
      }))
    }
  }

  const handleConnect = async (provider: EmailProvider) => {
    try {
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: true }
      }))

      const response = await emailService.getAuthUrl(provider)

      console.log('Auth response:', response)
      console.log('Auth URL:', response.authUrl)

      // Open the auth URL in a new window
      window.open(response.authUrl, "_blank", "width=500,height=600")

      // Poll for authentication status
      const pollInterval = setInterval(async () => {
        try {
          const status = await emailService.checkAuthStatus(provider)
          if (status.authenticated) {
            await checkProviderStatus(provider)
            setSelectedProvider(provider)
            emailService.setProvider(provider)
            toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully!`)
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error("Poll failed:", err)
        }
      }, 2000)

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setProviders(prev => ({
          ...prev,
          [provider]: { ...prev[provider], loading: false }
        }))
      }, 300000)

    } catch (err) {
      console.error(`Failed to connect to ${provider}:`, err)
      toast.error(`Failed to connect to ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }))
    }
  }

  const handleDisconnect = async (provider: EmailProvider) => {
    try {
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: true }
      }))

      emailService.setProvider(provider)
      await emailService.logout()

      setProviders(prev => ({
        ...prev,
        [provider]: { connected: false, loading: false, profile: null }
      }))

      if (selectedProvider === provider) {
        // Find another connected provider or set to null
        const otherProvider = provider === 'gmail' ? 'outlook' : 'gmail'
        if (providers[otherProvider].connected) {
          setSelectedProvider(otherProvider)
          emailService.setProvider(otherProvider)
        } else {
          setSelectedProvider(null)
        }
      }

      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected`)
      onAuthChange?.(provider, false)
    } catch (err) {
      console.error(`Failed to disconnect from ${provider}:`, err)
      toast.error(`Failed to disconnect from ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }))
    }
  }

  const handleSelectProvider = (provider: EmailProvider) => {
    if (providers[provider].connected) {
      setSelectedProvider(provider)
      emailService.setProvider(provider)
      toast.success(`Switched to ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
    }
  }

  const getProviderIcon = (provider: EmailProvider) => {
    return <Mail className="h-5 w-5" />
  }

  const getProviderName = (provider: EmailProvider) => {
    return provider === 'gmail' ? 'Gmail' : 'Outlook'
  }

  const getProviderColor = (provider: EmailProvider) => {
    return provider === 'gmail' ? 'text-red-600' : 'text-blue-600'
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Email Account Management</span>
        </CardTitle>
        <CardDescription>
          Connect your email accounts to send and manage emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(['gmail', 'outlook'] as EmailProvider[]).map((provider) => (
          <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={getProviderColor(provider)}>
                {getProviderIcon(provider)}
              </div>
              <div>
                <h3 className="font-semibold">{getProviderName(provider)}</h3>
                {providers[provider].profile && (
                  <p className="text-sm text-gray-600">
                    {providers[provider].profile.emailAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {providers[provider].connected && (
                <>
                  <Badge
                    variant={selectedProvider === provider ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleSelectProvider(provider)}
                  >
                    {selectedProvider === provider ? "Active" : "Select"}
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </>
              )}

              <Button
                variant={providers[provider].connected ? "outline" : "default"}
                size="sm"
                onClick={() => providers[provider].connected
                  ? handleDisconnect(provider)
                  : handleConnect(provider)
                }
                disabled={providers[provider].loading}
                className={providers[provider].connected ? "" : getProviderColor(provider)}
              >
                {providers[provider].loading ? (
                  "Loading..."
                ) : providers[provider].connected ? (
                  "Disconnect"
                ) : (
                  <>
                    Connect
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        {selectedProvider && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Currently using {getProviderName(selectedProvider)}
              </span>
            </div>
          </div>
        )}

        {!selectedProvider && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Please connect an email account to continue
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
