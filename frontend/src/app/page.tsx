"use client";

import Link from "next/link";
import { PageHeader, StatCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { MaturityRadarChart } from "@/components/charts";
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
  Sparkles,
  Star,
} from "lucide-react";

const sampleMaturityData: Array<{ subject: string; value: number; fullMark: number }> = [];

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

const recentActivity = [
  {
    type: "culture",
    title: "AI Guild monthly meeting scheduled",
    time: "1 hour ago",
    status: "pending",
  },
  {
    type: "metrics",
    title: "Copilot acceptance rate hit 35% org-wide",
    time: "2 hours ago",
    status: "completed",
  },
  {
    type: "initiative",
    title: "AI Code Review pilot launched for Platform team",
    time: "5 hours ago",
    status: "completed",
  },
  {
    type: "assistant",
    title: "GitHub Copilot Enterprise license renewal due",
    time: "1 day ago",
    status: "pending",
  },
  {
    type: "value",
    title: "Developer productivity up 25% in Backend team",
    time: "2 days ago",
    status: "completed",
  },
];

export default function DashboardPage() {
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
                  <h2 className="text-xl font-bold text-gray-900">Company AI Maturity: Level 3 - Defined</h2>
                  <p className="text-sm text-gray-500">Track milestones, champions, hackathons & guild activities</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 text-gray-300" />
                    <Star className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maturity Level</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">5</p>
                  <p className="text-xs text-gray-500">Champions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">3</p>
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
          value="4"
          change={1}
          changeLabel="new this quarter"
          icon={Bot}
        />
        <StatCard
          title="Monthly AI Spend"
          value="$12.5K"
          change={8}
          changeLabel="vs budget"
          icon={DollarSign}
        />
        <StatCard
          title="Copilot Acceptance Rate"
          value="32%"
          change={5}
          changeLabel="vs last month"
          icon={TrendingUp}
        />
        <StatCard
          title="Teams Using AI"
          value="8/10"
          change={2}
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
            <MaturityRadarChart data={sampleMaturityData} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
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
