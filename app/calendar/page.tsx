'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { TopNavigation } from '@/components/top-navigation'
import CalendarConnection from '@/components/calendar/CalendarConnection'
import { Calendar } from 'lucide-react'

export default function CalendarPage() {
  return (
    <AuthGuard requireEmailConnection={true}>
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Calendar Integration</h1>
                <p className="text-gray-600">Manage your availability and schedule coffee chats</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Calendar Connection */}
            <CalendarConnection />

            {/* Benefits Sidebar - moved to bottom on mobile */}
            <div className="lg:hidden space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Auto-check availability</p>
                      <p className="text-sm text-gray-600">See your free times instantly</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Share availability</p>
                      <p className="text-sm text-gray-600">Send links to contacts for easy scheduling</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Auto-schedule meetings</p>
                      <p className="text-sm text-gray-600">Create calendar events automatically</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Smart suggestions</p>
                      <p className="text-sm text-gray-600">Get optimal meeting time recommendations</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Pro Tip</h3>
                <p className="text-blue-800 text-sm">
                  Set your working hours and preferred meeting duration to get the most accurate availability suggestions for your networking outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
