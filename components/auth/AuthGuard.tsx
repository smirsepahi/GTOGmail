'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import SignUpModal from './SignUpModal'
import { Mail, Users, FileText, ArrowRight } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireEmailConnection?: boolean
  fallback?: React.ReactNode
}

export default function AuthGuard({ 
  children, 
  requireEmailConnection = false,
  fallback 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => {
    // Show sign up modal if user is not authenticated
    if (!isLoading && !isAuthenticated) {
      setShowSignUp(true)
    }
  }, [isLoading, isAuthenticated])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign up prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to GTOGmail
              </h1>
              
              <p className="text-gray-600 mb-6">
                Sign up to unlock powerful email networking features
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  Save and track companies you're interested in
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Create and save email templates
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Connect Gmail or Outlook for full functionality
                </div>
              </div>

              <button
                onClick={() => setShowSignUp(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <SignUpModal 
          isOpen={showSignUp} 
          onClose={() => setShowSignUp(false)} 
        />
      </>
    )
  }

  // Show email connection prompt if required but not connected
  if (requireEmailConnection && !user?.isEmailConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Connection Required
          </h1>
          
          <p className="text-gray-600 mb-6">
            This feature requires an email connection to work properly.
          </p>

          <button
            onClick={() => setShowSignUp(true)}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
          >
            Connect Email
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <SignUpModal 
          isOpen={showSignUp} 
          onClose={() => setShowSignUp(false)} 
        />
      </div>
    )
  }

  // User is authenticated and meets requirements
  return <>{children}</>
}
