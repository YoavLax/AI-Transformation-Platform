'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TrendChart, HorizontalBarChart } from '@/components/charts';
import { 
  Users, 
  Zap, 
  CheckCircle2, 
  Code2, 
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Monitor,
  Filter,
  X,
  CalendarDays,
  Ticket
} from 'lucide-react';

// Types for API response - matching the actual API structure
interface LanguageMetrics {
  name: string;
  users: number;
  suggestions: number;
  acceptances: number;
}

interface EditorMetrics {
  name: string;
  users: number;
}

interface DailyData {
  date: string;
  activeUsers: number;
  engagedUsers: number;
  suggestions?: number;
  acceptances?: number;
  acceptanceRate: number;
}

interface OrganizationMetrics {
  name: string;
  totalActiveUsers: number;
  totalEngagedUsers: number;
  totalSuggestions: number;
  totalAcceptances: number;
  acceptanceRate: number;
  totalChats: number;
  languages: LanguageMetrics[];
  editors: EditorMetrics[];
  dailyData: DailyData[];
}

interface TeamMetrics {
  org: string;
  slug: string;
  name: string;
  totalActiveUsers: number;
  totalEngagedUsers: number;
  totalSuggestions: number;
  totalAcceptances: number;
  acceptanceRate: number;
  totalChats: number;
  languages: LanguageMetrics[];
  editors: EditorMetrics[];
  dailyData: DailyData[];
}

interface CopilotMetrics {
  summary: {
    totalActiveUsers: number;
    totalEngagedUsers: number;
    totalLicenses: number;
    totalRawLicenses?: number;
    orgLicenses?: number;
    enterpriseLicenses?: number;
    totalSuggestions: number;
    totalAcceptances: number;
    totalLinesGenerated: number;
    totalLinesAccepted: number;
    totalChats: number;
    acceptanceRate: number;
    utilizationRate: number;
    duplicateUsers?: number;
  };
  organizations: OrganizationMetrics[];
  teams: TeamMetrics[];
  languages: LanguageMetrics[];
  editors: EditorMetrics[];
  dailyData: DailyData[];
  enterprise: OrganizationMetrics | null;
  lastUpdated: string;
  deduplication?: {
    totalRawSeats: number;
    totalUniqueSeats: number;
    duplicateUsers: number;
    duplicateUsersList: Array<{ login: string; orgs: string[] }>;
    activeUsersFromSeats?: number;
    inactiveUsersFromSeats?: number;
    inactiveUsersList?: Array<{ login: string; orgs: string[]; lastActivityAt: string | null }>;
    enterpriseSeats?: number;
  };
}

export default function MetricsPage() {
  const [data, setData] = useState<CopilotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/copilot');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch metrics');
      }
      
      const metricsData = await response.json();
      setData(metricsData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format percentage
  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600 dark:text-gray-400">Loading GitHub Copilot metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Metrics"
          description={error}
          action={
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Code2}
          title="No Metrics Available"
          description="No GitHub Copilot usage data found. Make sure the API token has the required permissions and there is usage data available."
          action={
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          }
        />
      </div>
    );
  }

  // Get organization names
  const orgNames = (data.organizations || []).map(o => o.name);
  
  // Get all teams
  const allTeams = data.teams || [];
  
  // Get the selected team's metrics if a specific team is selected
  const selectedTeamData = selectedTeam !== 'all' 
    ? allTeams.find(t => `${t.org}/${t.slug}` === selectedTeam)
    : null;

  // Use selected team's metrics or overall summary
  const displayMetrics = selectedTeamData 
    ? {
        totalActiveUsers: selectedTeamData.totalActiveUsers,
        totalEngagedUsers: selectedTeamData.totalEngagedUsers,
        totalSuggestions: selectedTeamData.totalSuggestions,
        totalAcceptances: selectedTeamData.totalAcceptances,
        acceptanceRate: selectedTeamData.acceptanceRate,
        totalChats: selectedTeamData.totalChats,
      }
    : data.summary;

  // Prepare chart data - use team-specific data when filtered, otherwise use overall data
  const dailyDataSource = selectedTeamData?.dailyData || data.dailyData || [];
  const languagesSource = selectedTeamData?.languages || data.languages || [];
  const editorsSource = selectedTeamData?.editors || data.editors || [];

  const trendData = dailyDataSource.map(t => ({
    name: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    activeUsers: t.activeUsers,
    engagedUsers: t.engagedUsers,
    acceptanceRate: t.acceptanceRate
  }));

  const languageChartData = languagesSource
    .filter(l => l.suggestions > 0)
    .sort((a, b) => b.acceptances - a.acceptances)
    .slice(0, 10)
    .map(l => ({
      name: l.name,
      value: l.acceptances,
      label: `${formatNumber(l.acceptances)} acceptances`
    }));

  const editorChartData = editorsSource
    .filter(e => e.users > 0)
    .sort((a, b) => b.users - a.users)
    .map(e => ({
      name: e.name,
      value: e.users,
      label: `${e.users} users`
    }));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GitHub Copilot Metrics
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Usage data from your GitHub organizations (last 28 days)
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Info */}
      {selectedTeam === 'all' && trendData.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Data from last 28 days.</strong> Summary shows latest day. 
            Peak in period: {Math.max(...trendData.map(d => d.activeUsers))} active users.
          </span>
        </div>
      )}

      {/* Team Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Teams (Organization Total)</option>
                {orgNames.map((org) => (
                  <optgroup key={org} label={org}>
                    {allTeams
                      .filter(t => t.org === org)
                      .sort((a, b) => b.totalActiveUsers - a.totalActiveUsers)
                      .map((team) => (
                        <option key={`${team.org}/${team.slug}`} value={`${team.org}/${team.slug}`}>
                          {team.name} ({team.totalActiveUsers} active users)
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {selectedTeam !== 'all' && (
                <button
                  onClick={() => setSelectedTeam('all')}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
            {selectedTeam !== 'all' && selectedTeamData && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Showing metrics for <strong>{selectedTeamData.name}</strong> from {selectedTeamData.org}
                </p>
              </div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {allTeams.length} teams across {orgNames.length} organization(s) • 
              {allTeams.filter(t => t.totalActiveUsers > 0).length} teams with activity
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedTeam === 'all' && data.summary.totalLicenses > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        <StatCard
          title="Active Users"
          value={displayMetrics.totalActiveUsers}
          subtitle={data.summary.totalLicenses > 0 
            ? `${formatPercent(displayMetrics.totalActiveUsers / data.summary.totalLicenses * 100)} of licenses`
            : undefined}
          icon={Users}
        />
        <StatCard
          title="Engaged Users"
          value={displayMetrics.totalEngagedUsers}
          subtitle={displayMetrics.totalActiveUsers > 0
            ? `${formatPercent(displayMetrics.totalEngagedUsers / displayMetrics.totalActiveUsers * 100)} of active`
            : undefined}
          icon={Zap}
        />
        {selectedTeam === 'all' && data.summary.totalLicenses > 0 && (
          <StatCard
            title="Total Licenses"
            value={data.summary.totalLicenses}
            subtitle={data.summary.orgLicenses && data.summary.enterpriseLicenses 
              ? `${data.summary.orgLicenses} Business + ${data.summary.enterpriseLicenses} Enterprise`
              : undefined}
            icon={Ticket}
          />
        )}
        <StatCard
          title="Acceptance Rate"
          value={formatPercent(displayMetrics.acceptanceRate || 0)}
          subtitle="of suggestions accepted"
          icon={CheckCircle2}
        />
      </div>

      {/* Suggestions & Acceptances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Suggestions"
          value={formatNumber(displayMetrics.totalSuggestions)}
          icon={Code2}
        />
        <StatCard
          title="Total Acceptances"
          value={formatNumber(displayMetrics.totalAcceptances)}
          icon={CheckCircle2}
        />
        <StatCard
          title="Chat Sessions"
          value={formatNumber(displayMetrics.totalChats)}
          icon={MessageSquare}
        />
      </div>

      {/* Usage Trends */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData}
              xKey="name"
              lines={[
                { key: 'activeUsers', color: '#3b82f6', name: 'Active Users' },
                { key: 'engagedUsers', color: '#10b981', name: 'Engaged Users' }
              ]}
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Acceptance Rate Trend */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acceptance Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData}
              xKey="name"
              lines={[
                { key: 'acceptanceRate', color: '#8b5cf6', name: 'Acceptance Rate (%)' }
              ]}
              height={250}
            />
          </CardContent>
        </Card>
      )}

      {/* Language & Editor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {languageChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Top Languages by Acceptances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart
                data={languageChartData}
                color="#3b82f6"
              />
            </CardContent>
          </Card>
        )}

        {editorChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Editor Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart
                data={editorChartData}
                color="#10b981"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Metrics Table */}
      {languagesSource.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Language Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Language</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Users</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Suggestions</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Acceptances</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Acceptance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {languagesSource
                    .filter(l => l.suggestions > 0)
                    .sort((a, b) => b.acceptances - a.acceptances)
                    .map((lang) => (
                      <tr 
                        key={lang.name} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{lang.name}</td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{lang.users}</td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{formatNumber(lang.suggestions)}</td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{formatNumber(lang.acceptances)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lang.suggestions > 0 
                              ? (lang.acceptances / lang.suggestions * 100) >= 30 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : (lang.acceptances / lang.suggestions * 100) >= 20
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {lang.suggestions > 0 
                              ? formatPercent(lang.acceptances / lang.suggestions * 100)
                              : 'N/A'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Users Table */}
      {selectedTeam === 'all' && data.deduplication?.inactiveUsersList && data.deduplication.inactiveUsersList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Inactive Users
              <span className="ml-2 px-2 py-0.5 text-sm font-normal bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                {data.deduplication.inactiveUsersList.length} users
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Users with Copilot licenses who have not used Copilot in the last 30 days.
            </p>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Username</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Organization(s)</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deduplication.inactiveUsersList.map((user) => (
                    <tr 
                      key={user.login} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{user.login}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {user.orgs.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {user.lastActivityAt ? (
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(user.lastActivityAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            Never
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
