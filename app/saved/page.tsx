'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import { TopNavigation } from '@/components/top-navigation'
import CompanyCard from '@/components/companies/CompanyCard'
import { companiesService, Company } from '@/lib/companies-service'
import { Heart, Search, Filter } from 'lucide-react'

export default function SavedPage() {
  const { user } = useAuth()
  const [savedCompanies, setSavedCompanies] = useState<Company[]>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (user && allCompanies.length > 0) {
      const saved = allCompanies.filter(company => 
        user.savedCompanies.includes(company.id)
      )
      setSavedCompanies(saved)
    }
  }, [user, allCompanies])

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      const companies = await companiesService.getCompanies()
      setAllCompanies(companies)
    } catch (error) {
      console.error('Failed to load companies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCompanies = savedCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600 fill-current" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Companies</h1>
                <p className="text-gray-600">Companies you've saved for future outreach</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search saved companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Saved</p>
                    <p className="text-2xl font-bold text-gray-900">{savedCompanies.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">$</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Daily Goal Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {savedCompanies.reduce((sum, company) => sum + company.dailyGoal, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">W</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weekly Goal Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {savedCompanies.reduce((sum, company) => sum + company.weeklyGoal, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <CompanyCard 
                  key={company.id} 
                  company={company} 
                  showSaveButton={true}
                />
              ))}
            </div>
          ) : savedCompanies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved companies yet</h3>
              <p className="text-gray-600 mb-6">Start saving companies you're interested in to see them here.</p>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Companies
              </a>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
