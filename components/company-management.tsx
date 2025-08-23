"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, Plus, Edit, Trash2, Target, TrendingUp, Calendar } from "lucide-react"
import { companiesService, Company, CompanyWithStats } from "@/lib/companies-service"
import { toast } from "sonner"

export function CompanyManagement() {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    color: 'bg-blue-100 text-blue-800',
    dailyGoal: 1,
    weeklyGoal: 5
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const companiesData = await companiesService.getCompaniesWithStats()
      setCompanies(companiesData)
    } catch (error) {
      console.error('Failed to load companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.domain) {
      toast.error('Name and domain are required')
      return
    }

    if (!companiesService.validateDomain(formData.domain)) {
      toast.error('Please enter a valid domain (e.g., company.com)')
      return
    }

    try {
      if (editingCompany) {
        await companiesService.updateCompany(editingCompany.id, formData)
        toast.success('Company updated successfully')
      } else {
        await companiesService.createCompany(formData)
        toast.success('Company added successfully')
      }
      
      setDialogOpen(false)
      setEditingCompany(null)
      resetForm()
      loadCompanies()
    } catch (error) {
      console.error('Failed to save company:', error)
      toast.error('Failed to save company')
    }
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      domain: company.domain,
      color: company.color,
      dailyGoal: company.dailyGoal,
      weeklyGoal: company.weeklyGoal
    })
    setDialogOpen(true)
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) {
      return
    }

    try {
      await companiesService.deleteCompany(company.id)
      toast.success('Company deleted successfully')
      loadCompanies()
    } catch (error) {
      console.error('Failed to delete company:', error)
      toast.error('Failed to delete company')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      color: 'bg-blue-100 text-blue-800',
      dailyGoal: 1,
      weeklyGoal: 5
    })
  }

  const openAddDialog = () => {
    setEditingCompany(null)
    resetForm()
    setDialogOpen(true)
  }

  const getProgressColor = (current: number, goal: number) => {
    const percentage = companiesService.calculateProgress(current, goal)
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const colorOptions = companiesService.getColorOptions()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading companies...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Company Email Tracking</span>
              </CardTitle>
              <CardDescription>
                Manage companies and set email outreach goals
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? 'Edit Company' : 'Add New Company'}
                  </DialogTitle>
                  <DialogDescription>
                    Set up email tracking and goals for a company domain
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., McKinsey & Company"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="e.g., mckinsey.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded ${option.preview}`} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dailyGoal">Daily Goal</Label>
                        <Input
                          id="dailyGoal"
                          type="number"
                          min="0"
                          value={formData.dailyGoal}
                          onChange={(e) => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weeklyGoal">Weekly Goal</Label>
                        <Input
                          id="weeklyGoal"
                          type="number"
                          min="0"
                          value={formData.weeklyGoal}
                          onChange={(e) => setFormData({ ...formData, weeklyGoal: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCompany ? 'Update' : 'Add'} Company
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies added yet</h3>
              <p className="text-gray-600 mb-4">Add companies to track your email outreach goals</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{company.name}</h3>
                          <p className="text-xs text-gray-600">@{company.domain}</p>
                        </div>
                      </div>
                      <Badge className={company.color}>
                        {company.color.split(' ')[0].replace('bg-', '').replace('-100', '')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Today
                          </span>
                          <span className="font-medium">{company.stats.todayCount}/{company.dailyGoal}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(company.stats.todayCount, company.dailyGoal)}`}
                            style={{ width: `${Math.min(companiesService.calculateProgress(company.stats.todayCount, company.dailyGoal), 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            This Week
                          </span>
                          <span className="font-medium">{company.stats.weekCount}/{company.weeklyGoal}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(company.stats.weekCount, company.weeklyGoal)}`}
                            style={{ width: `${Math.min(companiesService.calculateProgress(company.stats.weekCount, company.weeklyGoal), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {company.dailyGoal}/day, {company.weeklyGoal}/week
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(company)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
