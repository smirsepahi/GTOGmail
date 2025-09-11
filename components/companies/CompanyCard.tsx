'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, Target, Calendar, ExternalLink } from 'lucide-react'
import { Company } from '@/lib/companies-service'

interface CompanyCardProps {
  company: Company
  showSaveButton?: boolean
}

export default function CompanyCard({ company, showSaveButton = true }: CompanyCardProps) {
  const { user, saveCompany, unsaveCompany } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const isSaved = user?.savedCompanies.includes(company.id) || false

  const handleSaveToggle = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      if (isSaved) {
        await unsaveCompany(company.id)
      } else {
        await saveCompany(company.id)
      }
    } catch (error) {
      console.error('Failed to toggle save:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
            {showSaveButton && user && (
              <button
                onClick={handleSaveToggle}
                disabled={isLoading}
                className={`p-1.5 rounded-full transition-colors ${
                  isSaved
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
                } disabled:opacity-50`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">{company.domain}</span>
            <a
              href={`https://${company.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${company.color}`}>
            {company.name}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="w-4 h-4" />
          <span>Daily Goal: {company.dailyGoal} contacts</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="w-4 h-4" />
          <span>Weekly Goal: {company.weeklyGoal} contacts</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Added: {formatDate(company.createdAt)}</span>
        </div>
      </div>

      {isSaved && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-medium">Saved to your companies</span>
          </div>
        </div>
      )}
    </div>
  )
}
