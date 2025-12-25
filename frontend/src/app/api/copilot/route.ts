import { NextResponse } from "next/server";

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_ORGS = (process.env.GITHUB_ORGS || "").split(",").filter(Boolean);
const GITHUB_ENTERPRISE = process.env.GITHUB_ENTERPRISE || "";

const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_API_BASE = "https://api.github.com";

interface CopilotLanguageMetrics {
  name: string;
  total_engaged_users: number;
  total_code_suggestions?: number;
  total_code_acceptances?: number;
  total_code_lines_suggested?: number;
  total_code_lines_accepted?: number;
}

interface CopilotEditorModel {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date: string | null;
  total_engaged_users: number;
  languages?: CopilotLanguageMetrics[];
  total_chats?: number;
  total_chat_insertion_events?: number;
  total_chat_copy_events?: number;
}

interface CopilotEditor {
  name: string;
  total_engaged_users: number;
  models: CopilotEditorModel[];
}

interface CopilotMetricsDay {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions?: {
    total_engaged_users: number;
    languages: { name: string; total_engaged_users: number }[];
    editors: CopilotEditor[];
  };
  copilot_ide_chat?: {
    total_engaged_users: number;
    editors: CopilotEditor[];
  };
  copilot_dotcom_chat?: {
    total_engaged_users: number;
    models: CopilotEditorModel[];
  };
  copilot_dotcom_pull_requests?: {
    total_engaged_users: number;
    repositories: Array<{
      name: string;
      total_engaged_users: number;
      models: Array<{
        name: string;
        total_pr_summaries_created: number;
        total_engaged_users: number;
      }>;
    }>;
  };
}

interface TeamInfo {
  slug: string;
  name: string;
  description: string | null;
}

interface CopilotBilling {
  seat_breakdown: {
    total: number;
    added_this_cycle: number;
    pending_cancellation: number;
    pending_invitation: number;
    active_this_cycle: number;
    inactive_this_cycle: number;
  };
  seat_management_setting: string;
  public_code_suggestions: string;
}

// Individual seat/user info from billing seats API
interface CopilotSeat {
  assignee: {
    login: string;
    id: number;
    type: string;
  };
  assigning_team?: {
    slug: string;
    name: string;
  };
  pending_cancellation_date?: string;
  last_activity_at?: string;
  last_activity_editor?: string;
  created_at: string;
  updated_at?: string;
}

interface CopilotSeatsResponse {
  total_seats: number;
  seats: CopilotSeat[];
}

async function fetchGitHubAPI<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`GitHub API error for ${endpoint}: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`GitHub API fetch error for ${endpoint}:`, error);
    return null;
  }
}

async function getOrgCopilotMetrics(org: string): Promise<CopilotMetricsDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - 28); // Last 28 days
  const sinceStr = since.toISOString().split("T")[0];

  const metrics = await fetchGitHubAPI<CopilotMetricsDay[]>(
    `/orgs/${org}/copilot/metrics?since=${sinceStr}`
  );
  return metrics || [];
}

async function getOrgTeams(org: string): Promise<TeamInfo[]> {
  const teams = await fetchGitHubAPI<TeamInfo[]>(`/orgs/${org}/teams?per_page=100`);
  return teams || [];
}

async function getTeamCopilotMetrics(org: string, teamSlug: string): Promise<CopilotMetricsDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const sinceStr = since.toISOString().split("T")[0];

  const metrics = await fetchGitHubAPI<CopilotMetricsDay[]>(
    `/orgs/${org}/team/${teamSlug}/copilot/metrics?since=${sinceStr}`
  );
  return metrics || [];
}

async function getOrgCopilotBilling(org: string): Promise<CopilotBilling | null> {
  const billing = await fetchGitHubAPI<CopilotBilling>(`/orgs/${org}/copilot/billing`);
  if (!billing) {
    console.log(`Billing data not available for ${org} - token may need 'manage_billing:copilot' or 'read:org' scope`);
  }
  return billing;
}

// Fetch all individual user seats (with pagination)
async function getOrgCopilotSeats(org: string): Promise<CopilotSeat[]> {
  const allSeats: CopilotSeat[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetchGitHubAPI<CopilotSeatsResponse>(
      `/orgs/${org}/copilot/billing/seats?per_page=${perPage}&page=${page}`
    );
    
    if (!response || !response.seats || response.seats.length === 0) {
      break;
    }

    allSeats.push(...response.seats);

    // If we got fewer than perPage, we've reached the end
    if (response.seats.length < perPage) {
      break;
    }

    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 20) {
      console.warn(`Pagination limit reached for ${org} seats - may have more data`);
      break;
    }
  }

  return allSeats;
}

async function getEnterpriseCopilotMetrics(enterprise: string): Promise<CopilotMetricsDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const sinceStr = since.toISOString().split("T")[0];

  const metrics = await fetchGitHubAPI<CopilotMetricsDay[]>(
    `/enterprises/${enterprise}/copilot/metrics?since=${sinceStr}`
  );
  return metrics || [];
}

// Enterprise billing for enterprise-level licenses
interface EnterpriseCopilotBilling {
  total_seats: number;
  seats: CopilotSeat[];
}

async function getEnterpriseCopilotBilling(enterprise: string): Promise<{ totalSeats: number; seats: CopilotSeat[] }> {
  // Try to get enterprise billing info with pagination
  console.log(`Fetching enterprise billing for: ${enterprise}`);
  
  const allSeats: CopilotSeat[] = [];
  let page = 1;
  const perPage = 100;
  let totalSeats = 0;

  while (true) {
    const billing = await fetchGitHubAPI<EnterpriseCopilotBilling>(
      `/enterprises/${enterprise}/copilot/billing/seats?per_page=${perPage}&page=${page}`
    );
    
    if (!billing || !billing.seats || billing.seats.length === 0) {
      break;
    }

    // Get total from first response
    if (page === 1 && billing.total_seats) {
      totalSeats = billing.total_seats;
    }

    allSeats.push(...billing.seats);

    // If we got fewer than perPage, we've reached the end
    if (billing.seats.length < perPage) {
      break;
    }

    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 20) {
      console.warn(`Pagination limit reached for enterprise seats - may have more data`);
      break;
    }
  }
  
  console.log(`Enterprise billing response: ${totalSeats || allSeats.length} total seats, ${allSeats.length} fetched`);
  
  return {
    totalSeats: totalSeats || allSeats.length,
    seats: allSeats,
  };
}

function aggregateMetrics(metricsData: CopilotMetricsDay[]) {
  if (metricsData.length === 0) {
    return {
      totalActiveUsers: 0,
      totalEngagedUsers: 0,
      totalSuggestions: 0,
      totalAcceptances: 0,
      totalLinesGenerated: 0,
      totalLinesAccepted: 0,
      acceptanceRate: 0,
      totalChats: 0,
      totalChatInsertions: 0,
      totalChatCopies: 0,
      languages: [] as { name: string; users: number; suggestions: number; acceptances: number }[],
      editors: [] as { name: string; users: number }[],
      dailyData: [] as { date: string; activeUsers: number; engagedUsers: number; suggestions: number; acceptances: number; acceptanceRate: number }[],
    };
  }

  // Get latest day for active/engaged users
  const latestDay = metricsData[metricsData.length - 1];
  
  // Aggregate totals across all days
  let totalSuggestions = 0;
  let totalAcceptances = 0;
  let totalLinesGenerated = 0;
  let totalLinesAccepted = 0;
  let totalChats = 0;
  let totalChatInsertions = 0;
  let totalChatCopies = 0;

  const languageMap = new Map<string, { users: number; suggestions: number; acceptances: number }>();
  const editorMap = new Map<string, number>();

  for (const day of metricsData) {
    // Code completions
    if (day.copilot_ide_code_completions?.editors) {
      for (const editor of day.copilot_ide_code_completions.editors) {
        editorMap.set(editor.name, Math.max(editorMap.get(editor.name) || 0, editor.total_engaged_users));
        
        for (const model of editor.models) {
          if (model.languages) {
            for (const lang of model.languages) {
              const existing = languageMap.get(lang.name) || { users: 0, suggestions: 0, acceptances: 0 };
              languageMap.set(lang.name, {
                users: Math.max(existing.users, lang.total_engaged_users || 0),
                suggestions: existing.suggestions + (lang.total_code_suggestions || 0),
                acceptances: existing.acceptances + (lang.total_code_acceptances || 0),
              });
              totalSuggestions += lang.total_code_suggestions || 0;
              totalAcceptances += lang.total_code_acceptances || 0;
              totalLinesGenerated += lang.total_code_lines_suggested || 0;
              totalLinesAccepted += lang.total_code_lines_accepted || 0;
            }
          }
        }
      }
    }

    // Chat metrics
    if (day.copilot_ide_chat?.editors) {
      for (const editor of day.copilot_ide_chat.editors) {
        for (const model of editor.models) {
          totalChats += model.total_chats || 0;
          totalChatInsertions += model.total_chat_insertion_events || 0;
          totalChatCopies += model.total_chat_copy_events || 0;
        }
      }
    }

    if (day.copilot_dotcom_chat?.models) {
      for (const model of day.copilot_dotcom_chat.models) {
        totalChats += model.total_chats || 0;
      }
    }
  }

  // Calculate acceptance rate
  const acceptanceRate = totalSuggestions > 0 ? (totalAcceptances / totalSuggestions) * 100 : 0;

  // Build daily data for trend charts
  const dailyData = metricsData.map((day) => {
    let daySuggestions = 0;
    let dayAcceptances = 0;
    
    if (day.copilot_ide_code_completions?.editors) {
      for (const editor of day.copilot_ide_code_completions.editors) {
        for (const model of editor.models) {
          if (model.languages) {
            for (const lang of model.languages) {
              daySuggestions += lang.total_code_suggestions || 0;
              dayAcceptances += lang.total_code_acceptances || 0;
            }
          }
        }
      }
    }

    return {
      date: day.date,
      activeUsers: day.total_active_users,
      engagedUsers: day.total_engaged_users,
      suggestions: daySuggestions,
      acceptances: dayAcceptances,
      acceptanceRate: daySuggestions > 0 ? (dayAcceptances / daySuggestions) * 100 : 0,
    };
  });

  // Sort languages by suggestions
  const languages = Array.from(languageMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.suggestions - a.suggestions);

  // Sort editors by users
  const editors = Array.from(editorMap.entries())
    .map(([name, users]) => ({ name, users }))
    .sort((a, b) => b.users - a.users);

  return {
    totalActiveUsers: latestDay.total_active_users,
    totalEngagedUsers: latestDay.total_engaged_users,
    totalSuggestions,
    totalAcceptances,
    totalLinesGenerated,
    totalLinesAccepted,
    acceptanceRate,
    totalChats,
    totalChatInsertions,
    totalChatCopies,
    languages,
    editors,
    dailyData,
  };
}

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    const allOrgData: Array<{
      org: string;
      metrics: ReturnType<typeof aggregateMetrics>;
      billing: CopilotBilling | null;
      seats: CopilotSeat[];
      teams: Array<{
        slug: string;
        name: string;
        metrics: ReturnType<typeof aggregateMetrics>;
      }>;
    }> = [];

    // Fetch data for each organization
    for (const org of GITHUB_ORGS) {
      const [orgMetrics, billing, teams, seats] = await Promise.all([
        getOrgCopilotMetrics(org),
        getOrgCopilotBilling(org),
        getOrgTeams(org),
        getOrgCopilotSeats(org),
      ]);

      console.log(`Org ${org}: billing.total=${billing?.seat_breakdown?.total}, seats.length=${seats.length}`);

      // Fetch team-level metrics for all teams
      const teamMetricsPromises = teams.map(async (team) => {
        const teamMetrics = await getTeamCopilotMetrics(org, team.slug);
        return {
          slug: team.slug,
          name: team.name,
          description: team.description,
          metrics: aggregateMetrics(teamMetrics),
        };
      });

      const teamsWithMetrics = await Promise.all(teamMetricsPromises);

      allOrgData.push({
        org,
        metrics: aggregateMetrics(orgMetrics),
        billing,
        seats,
        teams: teamsWithMetrics, // Include all teams, not just active ones
      });
    }

    // Deduplicate users across organizations
    const allUsersMap = new Map<string, { 
      login: string; 
      orgs: string[]; 
      lastActivityAt: string | null;
      isActive: boolean;
    }>();

    for (const orgData of allOrgData) {
      for (const seat of orgData.seats) {
        const login = seat.assignee.login.toLowerCase();
        const existing = allUsersMap.get(login);
        
        // A user is considered "active" if they have recent activity
        // last_activity_at is set when they've used Copilot recently
        const hasRecentActivity = !!seat.last_activity_at;
        
        if (existing) {
          existing.orgs.push(orgData.org);
          // Keep track of the most recent activity
          if (seat.last_activity_at && (!existing.lastActivityAt || seat.last_activity_at > existing.lastActivityAt)) {
            existing.lastActivityAt = seat.last_activity_at;
          }
          existing.isActive = existing.isActive || hasRecentActivity;
        } else {
          allUsersMap.set(login, {
            login: seat.assignee.login,
            orgs: [orgData.org],
            lastActivityAt: seat.last_activity_at || null,
            isActive: hasRecentActivity,
          });
        }
      }
    }

    // Calculate deduplicated counts
    const uniqueUsers = Array.from(allUsersMap.values());
    const totalUniqueSeats = uniqueUsers.length;
    const duplicateUsers = uniqueUsers.filter(u => u.orgs.length > 1);
    const totalDuplicates = duplicateUsers.length;

    // Also fetch enterprise-level metrics and billing if configured
    let enterpriseMetrics = null;
    let enterpriseBilling = { totalSeats: 0, seats: [] as CopilotSeat[] };
    
    if (GITHUB_ENTERPRISE) {
      const [entMetrics, entBilling] = await Promise.all([
        getEnterpriseCopilotMetrics(GITHUB_ENTERPRISE),
        getEnterpriseCopilotBilling(GITHUB_ENTERPRISE),
      ]);
      enterpriseMetrics = aggregateMetrics(entMetrics);
      enterpriseBilling = entBilling;
      
      // Add enterprise seats to the user map (they might overlap with org seats)
      for (const seat of enterpriseBilling.seats) {
        const login = seat.assignee.login.toLowerCase();
        const existing = allUsersMap.get(login);
        const hasRecentActivity = !!seat.last_activity_at;
        
        if (existing) {
          if (!existing.orgs.includes('Enterprise')) {
            existing.orgs.push('Enterprise');
          }
          if (seat.last_activity_at && (!existing.lastActivityAt || seat.last_activity_at > existing.lastActivityAt)) {
            existing.lastActivityAt = seat.last_activity_at;
          }
          existing.isActive = existing.isActive || hasRecentActivity;
        } else {
          allUsersMap.set(login, {
            login: seat.assignee.login,
            orgs: ['Enterprise'],
            lastActivityAt: seat.last_activity_at || null,
            isActive: hasRecentActivity,
          });
        }
      }
    }

    // Recalculate after adding enterprise seats
    const allUniqueUsers = Array.from(allUsersMap.values());
    const totalAllUniqueSeats = allUniqueUsers.length;
    
    // Count users who exist in multiple ORGANIZATIONS (not counting enterprise as an org)
    // This is the meaningful "overlap" metric for org-level deduplication
    const orgDuplicateUsers = allUniqueUsers.filter(u => {
      const orgCount = u.orgs.filter(o => o !== 'Enterprise').length;
      return orgCount > 1;
    });
    const totalOrgDuplicates = orgDuplicateUsers.length;
    
    // Also track total users with any duplicate (org OR enterprise)
    const allDuplicateUsers = allUniqueUsers.filter(u => u.orgs.length > 1);
    const totalAllDuplicates = allDuplicateUsers.length;

    // Calculate seat counts
    // If enterprise billing is available and has more seats than org sum, use enterprise as source of truth
    const orgSeatsSum = allOrgData.reduce((sum, o) => sum + o.seats.length, 0);
    const enterpriseSeatsCount = enterpriseBilling.totalSeats;
    
    // Enterprise billing typically includes ALL seats (org + enterprise-level)
    // So we use the larger of: enterprise total OR deduplicated org+enterprise seats
    const totalUniqueFromAPI = enterpriseSeatsCount > 0 ? enterpriseSeatsCount : totalAllUniqueSeats;
    
    console.log(`Deduplication stats: orgSeats=${orgSeatsSum}, enterpriseSeats=${enterpriseSeatsCount}, uniqueUsers=${totalAllUniqueSeats}, orgDuplicates=${totalOrgDuplicates}`);

    // Calculate aggregate totals across all orgs (raw sums from metrics API)
    const rawActiveUsers = allOrgData.reduce((sum, o) => sum + o.metrics.totalActiveUsers, 0);
    const rawEngagedUsers = allOrgData.reduce((sum, o) => sum + o.metrics.totalEngagedUsers, 0);

    // The metrics API reports active users per-org, which can include:
    // 1. Duplicates if a user is in multiple orgs
    // 2. Users with GitHub access but no Copilot license (unlikely but possible)
    // 
    // Instead of using the metrics API counts, we use the SEAT DATA which has
    // the actual individual users and their last_activity_at timestamps.
    // This gives us accurate, deduplicated active user counts.
    
    // Count unique active users from seat data (users with last_activity_at set)
    // We use the allUsersMap which is already deduplicated by login
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersFromSeats = allUniqueUsers.filter(u => {
      if (!u.lastActivityAt) return false;
      const activityDate = new Date(u.lastActivityAt);
      return activityDate >= thirtyDaysAgo;
    });
    
    // Get non-active users (those with no activity or activity older than 30 days)
    const inactiveUsersFromSeats = allUniqueUsers.filter(u => {
      if (!u.lastActivityAt) return true; // No activity at all
      const activityDate = new Date(u.lastActivityAt);
      return activityDate < thirtyDaysAgo;
    });
    
    const uniqueActiveUserCount = activeUsersFromSeats.length;
    const uniqueInactiveUserCount = inactiveUsersFromSeats.length;
    
    // For engaged users, we don't have direct data from seats API,
    // so we estimate based on the ratio from metrics API
    // (engaged is typically a subset of active)
    const rawEngagedToActiveRatio = rawActiveUsers > 0 ? rawEngagedUsers / rawActiveUsers : 0.8;
    const estimatedUniqueEngagedUsers = Math.round(uniqueActiveUserCount * rawEngagedToActiveRatio);
    
    console.log(`Active users from seats: ${uniqueActiveUserCount} (with activity in last 30 days)`);
    console.log(`Raw metrics API: active=${rawActiveUsers}, engaged=${rawEngagedUsers}`);
    console.log(`Estimated unique engaged: ${estimatedUniqueEngagedUsers} (ratio: ${rawEngagedToActiveRatio.toFixed(2)})`);

    // Use seat-based count for active users (accurate), fallback to estimated if 0
    const estimatedUniqueActiveUsers = uniqueActiveUserCount > 0 
      ? uniqueActiveUserCount 
      : Math.min(rawActiveUsers, enterpriseSeatsCount > 0 ? enterpriseSeatsCount : totalAllUniqueSeats);

    // Get org-level license counts from billing API
    const orgBillingTotal = allOrgData.reduce((sum, o) => sum + (o.billing?.seat_breakdown?.total || o.seats.length), 0);
    const rawOrgSeats = allOrgData.reduce((sum, o) => sum + o.seats.length, 0);
    
    // If enterprise billing is available and greater than org sum, 
    // the difference is enterprise-only licenses
    const enterpriseOnlyLicenses = enterpriseSeatsCount > orgBillingTotal 
      ? enterpriseSeatsCount - orgBillingTotal 
      : 0;

    // Total licenses = enterprise total if available, otherwise org sum
    const totalLicenses = enterpriseSeatsCount > 0 ? enterpriseSeatsCount : totalAllUniqueSeats;

    const aggregateTotals = {
      totalActiveUsers: estimatedUniqueActiveUsers,
      totalEngagedUsers: estimatedUniqueEngagedUsers,
      totalLicenses: totalLicenses, // Use enterprise total as the authoritative count
      totalRawLicenses: rawOrgSeats, // Keep raw count for reference
      orgLicenses: orgBillingTotal, // Business licenses from orgs
      enterpriseLicenses: enterpriseOnlyLicenses, // Enterprise-only licenses (additional beyond org)
      totalSuggestions: allOrgData.reduce((sum, o) => sum + o.metrics.totalSuggestions, 0),
      totalAcceptances: allOrgData.reduce((sum, o) => sum + o.metrics.totalAcceptances, 0),
      totalLinesGenerated: allOrgData.reduce((sum, o) => sum + o.metrics.totalLinesGenerated, 0),
      totalLinesAccepted: allOrgData.reduce((sum, o) => sum + o.metrics.totalLinesAccepted, 0),
      totalChats: allOrgData.reduce((sum, o) => sum + o.metrics.totalChats, 0),
      duplicateUsers: totalOrgDuplicates, // Users in multiple orgs (more meaningful metric)
    };

    const overallAcceptanceRate = 
      aggregateTotals.totalSuggestions > 0 
        ? (aggregateTotals.totalAcceptances / aggregateTotals.totalSuggestions) * 100 
        : 0;

    // Merge language data across orgs
    const allLanguages = new Map<string, { users: number; suggestions: number; acceptances: number }>();
    for (const orgData of allOrgData) {
      for (const lang of orgData.metrics.languages) {
        const existing = allLanguages.get(lang.name) || { users: 0, suggestions: 0, acceptances: 0 };
        allLanguages.set(lang.name, {
          users: existing.users + lang.users,
          suggestions: existing.suggestions + lang.suggestions,
          acceptances: existing.acceptances + lang.acceptances,
        });
      }
    }

    // Merge editor data across orgs
    const allEditors = new Map<string, number>();
    for (const orgData of allOrgData) {
      for (const editor of orgData.metrics.editors) {
        allEditors.set(editor.name, (allEditors.get(editor.name) || 0) + editor.users);
      }
    }

    // Merge daily data (combine by date)
    const dailyDataMap = new Map<string, { activeUsers: number; engagedUsers: number; suggestions: number; acceptances: number }>();
    for (const orgData of allOrgData) {
      for (const day of orgData.metrics.dailyData) {
        const existing = dailyDataMap.get(day.date) || { activeUsers: 0, engagedUsers: 0, suggestions: 0, acceptances: 0 };
        dailyDataMap.set(day.date, {
          activeUsers: existing.activeUsers + day.activeUsers,
          engagedUsers: existing.engagedUsers + day.engagedUsers,
          suggestions: existing.suggestions + (day.suggestions || 0),
          acceptances: existing.acceptances + (day.acceptances || 0),
        });
      }
    }

    // Calculate deduplication ratio for daily data
    // We use the ratio of unique active users (from seats) to raw active users (from metrics API sum)
    const activeUserDeduplicationRatio = rawActiveUsers > 0 
      ? uniqueActiveUserCount / rawActiveUsers 
      : 1;
    
    // Apply deduplication ratio to daily active/engaged user counts
    // Cap at the unique active user count (can't have more active than we measured from seats)
    const dailyData = Array.from(dailyDataMap.entries())
      .map(([date, data]) => {
        // Apply ratio and cap at unique active user count
        const estimatedActiveUsers = Math.min(
          Math.round(data.activeUsers * activeUserDeduplicationRatio),
          uniqueActiveUserCount
        );
        const estimatedEngagedUsers = Math.min(
          Math.round(data.engagedUsers * activeUserDeduplicationRatio),
          estimatedActiveUsers // Engaged can't exceed active
        );
        return {
          date,
          activeUsers: estimatedActiveUsers,
          engagedUsers: estimatedEngagedUsers,
          suggestions: data.suggestions,
          acceptances: data.acceptances,
          acceptanceRate: data.suggestions > 0 ? (data.acceptances / data.suggestions) * 100 : 0,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build teams list for dropdown
    const allTeams = allOrgData.flatMap((o) =>
      o.teams.map((t) => ({
        org: o.org,
        slug: t.slug,
        name: t.name,
        ...t.metrics,
      }))
    );

    return NextResponse.json({
      summary: {
        ...aggregateTotals,
        acceptanceRate: overallAcceptanceRate,
        utilizationRate: aggregateTotals.totalLicenses > 0 
          ? (aggregateTotals.totalActiveUsers / aggregateTotals.totalLicenses) * 100 
          : 0,
      },
      organizations: allOrgData.map((o) => ({
        name: o.org,
        ...o.metrics,
        billing: o.billing,
        seatCount: o.seats.length,
      })),
      deduplication: {
        totalRawSeats: rawOrgSeats,
        totalUniqueSeats: totalAllUniqueSeats,
        duplicateUsers: totalOrgDuplicates, // Users in multiple orgs
        duplicateUsersList: orgDuplicateUsers.map(u => ({
          login: u.login,
          orgs: u.orgs.filter(o => o !== 'Enterprise'), // Show only org overlap
        })),
        activeUsersFromSeats: uniqueActiveUserCount, // Accurate count from seat activity data
        inactiveUsersFromSeats: uniqueInactiveUserCount, // Users with no recent activity
        inactiveUsersList: inactiveUsersFromSeats.map(u => ({
          login: u.login,
          orgs: u.orgs,
          lastActivityAt: u.lastActivityAt,
        })).sort((a, b) => {
          // Sort by last activity date (null/never active first, then oldest)
          if (!a.lastActivityAt && !b.lastActivityAt) return 0;
          if (!a.lastActivityAt) return -1;
          if (!b.lastActivityAt) return 1;
          return a.lastActivityAt.localeCompare(b.lastActivityAt);
        }),
        rawActiveUsersFromMetrics: rawActiveUsers, // Sum from metrics API (may have duplicates)
        enterpriseSeats: enterpriseBilling.totalSeats,
      },
      teams: allTeams,
      languages: Array.from(allLanguages.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.suggestions - a.suggestions),
      editors: Array.from(allEditors.entries())
        .map(([name, users]) => ({ name, users }))
        .sort((a, b) => b.users - a.users),
      dailyData,
      enterprise: enterpriseMetrics,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Copilot metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch Copilot metrics" },
      { status: 500 }
    );
  }
}
