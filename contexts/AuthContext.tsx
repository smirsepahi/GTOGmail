'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  name: string
  emailProvider: 'gmail' | 'outlook' | null
  isEmailConnected: boolean
  isCalendarConnected?: boolean
  calendarEmail?: string
  createdAt: string
  savedCompanies: string[]
  savedTemplates: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, name: string) => Promise<void>
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  connectEmail: (provider: 'gmail' | 'outlook') => Promise<void>
  connectCalendar: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  saveCompany: (companyId: string) => Promise<void>
  unsaveCompany: (companyId: string) => Promise<void>
  saveTemplate: (templateId: string) => Promise<void>
  unsaveTemplate: (templateId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const savedUser = localStorage.getItem('gto_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, name: string) => {
    try {
      setIsLoading(true)

      // Create new user
      const newUser: User = {
        id: generateUserId(),
        email,
        name,
        emailProvider: null,
        isEmailConnected: false,
        createdAt: new Date().toISOString(),
        savedCompanies: [],
        savedTemplates: []
      }

      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('gto_user', JSON.stringify(newUser))
      setUser(newUser)

      console.log('✅ User signed up successfully:', newUser)
    } catch (error) {
      console.error('❌ Sign up failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string) => {
    try {
      setIsLoading(true)

      // In production, this would validate against a database
      const savedUser = localStorage.getItem('gto_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        if (userData.email === email) {
          setUser(userData)
          console.log('✅ User signed in successfully:', userData)
          return
        }
      }

      throw new Error('User not found')
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem('gto_user')
      setUser(null)
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      throw error
    }
  }

  const connectEmail = async (provider: 'gmail' | 'outlook') => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = {
        ...user,
        emailProvider: provider,
        isEmailConnected: true
      }

      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log(`✅ ${provider} connected successfully`)
    } catch (error) {
      console.error(`❌ Failed to connect ${provider}:`, error)
      throw error
    }
  }

  const connectCalendar = async () => {
    try {
      if (!user) throw new Error('No user logged in')

      // Import calendar service dynamically to avoid SSR issues
      const { calendarService } = await import('@/lib/calendar-service')

      // Get auth URL and open OAuth flow
      const response = await calendarService.connectCalendar()

      // Open Google Calendar auth in new window
      window.open(response.authUrl, '_blank', 'width=500,height=600')

      // Poll for connection status
      const pollInterval = setInterval(async () => {
        try {
          const status = await calendarService.checkCalendarStatus()
          if (status.connected) {
            const updatedUser = {
              ...user,
              isCalendarConnected: true,
              calendarEmail: status.email
            }

            localStorage.setItem('gto_user', JSON.stringify(updatedUser))
            setUser(updatedUser)
            clearInterval(pollInterval)

            console.log('✅ Google Calendar connected successfully')
          }
        } catch (err) {
          console.error('Calendar connection poll failed:', err)
        }
      }, 2000)

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000)

    } catch (error) {
      console.error('❌ Failed to connect Google Calendar:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = { ...user, ...updates }
      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      throw error
    }
  }

  const saveCompany = async (companyId: string) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = {
        ...user,
        savedCompanies: [...user.savedCompanies, companyId]
      }

      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('✅ Company saved successfully')
    } catch (error) {
      console.error('❌ Failed to save company:', error)
      throw error
    }
  }

  const unsaveCompany = async (companyId: string) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = {
        ...user,
        savedCompanies: user.savedCompanies.filter(id => id !== companyId)
      }

      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('✅ Company unsaved successfully')
    } catch (error) {
      console.error('❌ Failed to unsave company:', error)
      throw error
    }
  }

  const saveTemplate = async (templateId: string) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = {
        ...user,
        savedTemplates: [...user.savedTemplates, templateId]
      }

      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('✅ Template saved successfully')
    } catch (error) {
      console.error('❌ Failed to save template:', error)
      throw error
    }
  }

  const unsaveTemplate = async (templateId: string) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updatedUser = {
        ...user,
        savedTemplates: user.savedTemplates.filter(id => id !== templateId)
      }

      localStorage.setItem('gto_user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('✅ Template unsaved successfully')
    } catch (error) {
      console.error('❌ Failed to unsave template:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    connectEmail,
    connectCalendar,
    updateProfile,
    saveCompany,
    unsaveCompany,
    saveTemplate,
    unsaveTemplate
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Helper function to generate user ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}
