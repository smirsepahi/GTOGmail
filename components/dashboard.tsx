import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, Building2, Clock, TrendingUp, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { gmailService } from "@/lib/gmail-service"
import { companiesService, CompanyWithStats } from "@/lib/companies-service"

interface DashboardStats {
  emailsSentThisWeek: number
  emailsSentToday: number
  coffeeChatCount: number
  companiesContacted: number
  timeSaved: string
}

// Removed mock data - using real Gmail statistics instead

const statusColors = {
  active: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
}

export function Dashboard() {
  // Add new stats for company tracking
  const [companyStats, setCompanyStats] = useState<CompanyWithStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    emailsSentThisWeek: 0,
    emailsSentToday: 0,
    coffeeChatCount: 0,
    companiesContacted: 0,
    timeSaved: "0 hrs"
  });
  const [loading, setLoading] = useState(true);

  // Fetch real email statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch company stats
        const companyStatsData = await companiesService.getCompaniesWithStats('week');
        setCompanyStats(companyStatsData);

        // Fetch Gmail statistics directly
        try {
          // Check Gmail authentication status
          const authStatus = await gmailService.checkAuthStatus();

          if (authStatus.authenticated) {
            // Get real Gmail domain statistics
            const weekStats = await gmailService.getDomainStats('week');
            const todayStats = await gmailService.getDomainStats('today');

            // Count unique domains contacted (companies contacted)
            const companiesContacted = Object.keys(weekStats.domainCounts).length;

            setDashboardStats(prev => ({
              ...prev,
              emailsSentThisWeek: weekStats.totalEmails,
              emailsSentToday: todayStats.totalEmails,
              companiesContacted: companiesContacted,
              timeSaved: `${(weekStats.totalEmails * 0.2).toFixed(1)} hrs` // Estimate 0.2 hours saved per email
            }));
          } else {
            console.log('Gmail not authenticated, showing zero values');
            setDashboardStats(prev => ({
              ...prev,
              emailsSentThisWeek: 0,
              emailsSentToday: 0,
              companiesContacted: 0,
              timeSaved: "0 hrs"
            }));
          }
        } catch (emailError) {
          console.error('Error fetching Gmail statistics:', emailError);
          // Keep default zero values if Gmail API fails
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      title: "Emails Sent This Week",
      value: loading ? "..." : dashboardStats.emailsSentThisWeek.toString(),
      change: `${dashboardStats.emailsSentToday} sent today`,
      icon: Mail,
      color: "text-blue-600",
    },
    {
      title: "Coffee Chats Scheduled",
      value: dashboardStats.coffeeChatCount.toString(),
      change: "+2 from last week",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Companies Contacted",
      value: loading ? "..." : dashboardStats.companiesContacted.toString(),
      change: "This week",
      icon: Building2,
      color: "text-purple-600",
    },
    {
      title: "Time Saved by AI",
      value: dashboardStats.timeSaved,
      change: "This week",
      icon: Clock,
      color: "text-orange-600",
    },
  ];
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 w-full">
      {/* Stats Grid - Horizontal Layout */}
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2 leading-relaxed">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{stat.change}</p>
                  </div>
                  <stat.icon className={`h-12 w-12 ${stat.color} flex-shrink-0`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Goal Companies Progress - Takes 1/3 width */}
          <div className="xl:col-span-1">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <span>Goal Companies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyStats.slice(0, 5).map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{company.name}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {company.stats.weekCount} emails this week
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {company.stats.weekCount}/{company.weeklyGoal}
                        </div>
                        <div className="w-12 bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${company.stats.progress.weekly}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {companyStats.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No goal companies set. Add companies in the Goals tab.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Statistics - Takes 1/3 width */}
          <div className="xl:col-span-1">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Email Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Today</p>
                      <p className="text-xs text-blue-700">Emails sent</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardStats.emailsSentToday}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">This Week</p>
                      <p className="text-xs text-green-700">Emails sent</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardStats.emailsSentThisWeek}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-900">Companies</p>
                      <p className="text-xs text-purple-700">Contacted this week</p>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardStats.companiesContacted}
                    </div>
                  </div>

                  {!loading && dashboardStats.emailsSentThisWeek === 0 && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Connect Gmail to see real statistics
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Goals - Takes 1/3 width */}
          <div className="xl:col-span-1">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Weekly Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-900 leading-relaxed">Send 15 Emails</span>
                      <span className="text-lg font-bold text-blue-700">{dashboardStats.emailsSentThisWeek}/15</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min((dashboardStats.emailsSentThisWeek / 15) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {dashboardStats.emailsSentThisWeek >= 15 ? "Goal achieved! 🎉" : `${15 - dashboardStats.emailsSentThisWeek} more to go!`}
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-900 leading-relaxed">Contact Goal Companies</span>
                      <span className="text-lg font-bold text-green-700">{dashboardStats.companiesContacted}/{companyStats.length}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${companyStats.length > 0 ? Math.min((dashboardStats.companiesContacted / companyStats.length) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      {companyStats.length > 0 && dashboardStats.companiesContacted >= companyStats.length ?
                        "All goal companies contacted! 🎉" :
                        companyStats.length > 0 ?
                          `${companyStats.length - dashboardStats.companiesContacted} more companies to contact` :
                          "Add goal companies to track progress"
                      }
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-purple-900 leading-relaxed">Contact 5 New Companies</span>
                      <span className="text-lg font-bold text-purple-700">{dashboardStats.companiesContacted}/5</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                      <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min((dashboardStats.companiesContacted / 5) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      {dashboardStats.companiesContacted >= 5 ? "Goal achieved! 🎉" : `${5 - dashboardStats.companiesContacted} more to reach goal`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Email Tracking */}
          <div className="xl:col-span-1">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Company Email Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyStats.length > 0 ? (
                    companyStats.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{company.name}</p>
                            <p className="text-xs text-gray-600">@{company.domain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{company.stats.weekCount}/{company.weeklyGoal}</p>
                              <p className="text-xs text-gray-600">{company.stats.todayCount}/{company.dailyGoal} today</p>
                            </div>
                            <div className="w-2 h-8 rounded-full bg-gray-200">
                              <div
                                className={`w-2 rounded-full transition-all ${
                                  companiesService.calculateProgress(company.stats.weekCount, company.weeklyGoal) >= 100
                                    ? 'bg-green-500'
                                    : companiesService.calculateProgress(company.stats.weekCount, company.weeklyGoal) >= 75
                                    ? 'bg-blue-500'
                                    : companiesService.calculateProgress(company.stats.weekCount, company.weeklyGoal) >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  height: `${Math.min(companiesService.calculateProgress(company.stats.weekCount, company.weeklyGoal), 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">No companies added yet</p>
                      <p className="text-xs text-gray-400">Add companies in the Goals tab to track email outreach</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
