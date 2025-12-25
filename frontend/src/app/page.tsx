"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, StatCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { MaturityRadarChart } from "@/components/charts";
import { api } from "@/lib/api";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { DashboardSummary, AIAssistant } from "@/types";
import {
  LayoutDashboard,
  Bot,
  Rocket,
  BarChart3,
  Users,
  DollarSign,
  Boxes,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";

const modules = [
  {
    name: "AI Assistants",
    description: "Manage AI tools, vendors, licenses, and costs",
    icon: Bot,
    href: "/assistants",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "AI Initiatives",
    description: "Track AI projects with governance and risk management",
    icon: Rocket,
    href: "/initiatives",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Usage Metrics",
    description: "Monitor GitHub Copilot and AI tool adoption",
    icon: BarChart3,
    href: "/metrics",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Team Maturity",
    description: "Assess AI maturity levels across engineering teams",
    icon: Users,
    href: "/maturity",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "AI Culture",
    description: "Guilds, hackathons, champions, and transformation milestones",
    icon: Trophy,
    href: "/culture",
    color: "from-yellow-500 to-amber-500",
  },
  {
    name: "Value Tracking",
    description: "Measure ROI and business impact of AI investments",
    icon: DollarSign,
    href: "/value",
    color: "from-indigo-500 to-violet-500",
  },
  {
    name: "Blueprints",
    description: "Reference architectures for AI-assisted development",
    icon: Boxes,
    href: "/blueprints",
    color: "from-teal-500 to-cyan-500",
  },
  {
    name: "Learning",
    description: "AI training paths for developers and teams",
    icon: GraduationCap,
    href: "/learning",
    color: "from-rose-500 to-red-500",
  },
];

// Helper to format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Helper to render maturity stars
function MaturityStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1 justify-center text-yellow-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= level ? "fill-current" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copilotData, setCopilotData] = useState<{
    acceptanceRate: number;
    teamsUsingAi: number;
    totalTeams: number;
  } | null>(null);

  // Sync localStorage data to backend on dashboard load
  const syncLocalDataToBackend = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Sync AI Assistants from localStorage
    try {
      const assistants = getFromStorage<AIAssistant[]>(STORAGE_KEYS.AI_ASSISTANTS, []);
      if (assistants.length > 0) {
        await fetch(`${API_URL}/api/assistants/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assistants),
        });
      }
    } catch (err) {
      console.error('Failed to sync assistants:', err);
    }
    
    // Try to fetch and sync Copilot metrics
    try {
      const response = await fetch('/api/copilot');
      if (response.ok) {
        const metricsData = await response.json();
        const syncPayload = {
          summary: {
            total_active_users: metricsData.summary?.totalActiveUsers || 0,
            total_engaged_users: metricsData.summary?.totalEngagedUsers || 0,
            total_licenses: metricsData.summary?.totalLicenses || 0,
            acceptance_rate: metricsData.summary?.acceptanceRate || 0,
            total_suggestions: metricsData.summary?.totalSuggestions || 0,
            total_acceptances: metricsData.summary?.totalAcceptances || 0,
            total_chats: metricsData.summary?.totalChats || 0,
          },
          teams: (metricsData.teams || []).map((t: { org: string; slug: string; name: string; totalActiveUsers: number; totalEngagedUsers: number; acceptanceRate: number }) => ({
            org: t.org,
            slug: t.slug,
            name: t.name,
            total_active_users: t.totalActiveUsers,
            total_engaged_users: t.totalEngagedUsers,
            acceptance_rate: t.acceptanceRate,
          })),
        };
        
        await fetch(`${API_URL}/api/metrics/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        });
      }
    } catch (err) {
      console.error('Failed to sync metrics:', err);
    }
  };

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch Copilot metrics directly for acceptance rate and teams
        try {
          const copilotResponse = await fetch('/api/copilot');
          if (copilotResponse.ok) {
            const metricsData = await copilotResponse.json();
            const teams = metricsData.teams || [];
            const teamsWithActivity = teams.filter((t: { totalActiveUsers: number }) => t.totalActiveUsers > 0);
            
            setCopilotData({
              acceptanceRate: metricsData.summary?.acceptanceRate || 0,
              teamsUsingAi: teamsWithActivity.length,
              totalTeams: teams.length,
            });
          }
        } catch (err) {
          console.log('Copilot API not available:', err);
        }
        
        // Sync localStorage data to backend
        await syncLocalDataToBackend();
        
        // Fetch dashboard summary from backend
        try {
          const summary = await api.get<DashboardSummary>("/api/dashboard/summary");
          setData(summary);
        } catch (err) {
          console.log('Backend not available, using local data only');
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Engineering AI Dashboard"
          description="Monitor and optimize AI adoption across engineering teams"
          icon={LayoutDashboard}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Only show error if we have no local data either
  const hasLocalData = getFromStorage<AIAssistant[]>(STORAGE_KEYS.AI_ASSISTANTS, []).length > 0;
  
  if (error && !hasLocalData && !data && !copilotData) {
    return (
      <div>
        <PageHeader
          title="Engineering AI Dashboard"
          description="Monitor and optimize AI adoption across engineering teams"
          icon={LayoutDashboard}
        />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Unable to load dashboard</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Still show Quick Access modules */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Link key={module.name} href={module.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center`}
                    >
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Calculate local data from localStorage if backend data is empty/zero
  const localAssistants = getFromStorage<AIAssistant[]>(STORAGE_KEYS.AI_ASSISTANTS, []);
  const activeLocalAssistants = localAssistants.filter(a => a.status === 'active');
  
  const localActiveAiTools = activeLocalAssistants.length;
  const localMonthlySpend = activeLocalAssistants.reduce(
    (sum, a) => sum + (a.monthly_price * a.licenses), 
    0
  );

  // Use backend data if available, otherwise fall back to localStorage/copilot data
  const stats = {
    active_ai_tools: data?.stats?.active_ai_tools || localActiveAiTools,
    active_ai_tools_change: data?.stats?.active_ai_tools_change || 0,
    monthly_spend: data?.stats?.monthly_spend || localMonthlySpend,
    monthly_spend_change: data?.stats?.monthly_spend_change || 0,
    copilot_acceptance_rate: copilotData?.acceptanceRate || data?.stats?.copilot_acceptance_rate || 0,
    copilot_acceptance_rate_change: data?.stats?.copilot_acceptance_rate_change || 0,
    teams_using_ai: copilotData?.teamsUsingAi || data?.stats?.teams_using_ai || 0,
    total_teams: copilotData?.totalTeams || data?.stats?.total_teams || 1,
    teams_change: data?.stats?.teams_change || 0,
  };

  const maturity = data?.maturity ?? {
    level: 1,
    label: "Initial",
    overall_score: 0,
    radar_data: [],
    champions: 0,
    initiatives_in_progress: 0,
  };

  const recentActivity = data?.recent_activity ?? [];
  return (
    <div>
      <PageHeader
        title="Engineering AI Dashboard"
        description="Monitor and optimize AI adoption across engineering teams"
        icon={LayoutDashboard}
      />

      {/* AI Culture Maturity Banner */}
      <Link href="/culture">
        <Card className="mb-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">AI Transformation Journey</p>
                  <h2 className="text-xl font-bold text-gray-900">
                    Company AI Maturity: Level {maturity.level} - {maturity.label}
                  </h2>
                  <p className="text-sm text-gray-500">Track milestones, champions, hackathons & guild activities</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <MaturityStars level={maturity.level} />
                  <p className="text-xs text-gray-500 mt-1">Maturity Level</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{maturity.champions}</p>
                  <p className="text-xs text-gray-500">Champions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{maturity.initiatives_in_progress}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active AI Tools"
          value={stats.active_ai_tools.toString()}
          change={stats.active_ai_tools_change}
          changeLabel="new this quarter"
          icon={Bot}
        />
        <StatCard
          title="Monthly AI Spend"
          value={formatCurrency(stats.monthly_spend)}
          change={stats.monthly_spend_change}
          changeLabel="vs budget"
          icon={DollarSign}
        />
        <StatCard
          title="Copilot Acceptance Rate"
          value={`${stats.copilot_acceptance_rate.toFixed(2)}%`}
          change={stats.copilot_acceptance_rate_change}
          changeLabel="vs last month"
          icon={TrendingUp}
        />
        <StatCard
          title="Teams Using AI"
          value={`${stats.teams_using_ai}/${stats.total_teams}`}
          change={stats.teams_change}
          changeLabel="new adopters"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Maturity Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organization AI Maturity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {maturity.radar_data.length > 0 ? (
              <MaturityRadarChart data={maturity.radar_data} />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <BarChart3 className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm">No assessment data yet</p>
                <Link href="/assessment/wizard" className="text-purple-600 text-sm mt-2 hover:underline">
                  Take your first assessment →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {activity.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : activity.status === "pending" ? (
                      <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <Clock className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Start creating use cases or assessments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Quick Links */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Link key={module.name} href={module.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center`}
                  >
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{module.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
