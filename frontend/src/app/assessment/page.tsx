"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from "@/components/ui";
import { MaturityRadarChart, TrendChart } from "@/components/charts";
import { Target, Plus, FileText, TrendingUp, Calendar } from "lucide-react";
import { Assessment } from "@/types";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

const pillarDescriptions: Record<string, string> = {
  data_readiness: "Data quality, accessibility, and infrastructure",
  technology: "AI/ML platforms, tools, and cloud capabilities",
  talent: "Skills, training, and AI expertise within the organization",
  governance: "Policies, ethics, and responsible AI practices",
  business_alignment: "Strategic vision and leadership commitment",
};

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const stored = getFromStorage<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
    setAssessments(stored);
  }, []);

  const latestAssessment = assessments[0];

  const radarData = latestAssessment
    ? [
        {
          subject: "Data Readiness",
          value: latestAssessment.scores.data_readiness,
          fullMark: 100,
        },
        {
          subject: "Technology",
          value: latestAssessment.scores.technology,
          fullMark: 100,
        },
        {
          subject: "Talent",
          value: latestAssessment.scores.talent,
          fullMark: 100,
        },
        {
          subject: "Governance",
          value: latestAssessment.scores.governance,
          fullMark: 100,
        },
        {
          subject: "Business Alignment",
          value: latestAssessment.scores.business_alignment,
          fullMark: 100,
        },
      ]
    : [];

  const trendData = assessments
    .slice()
    .reverse()
    .map((a) => ({
      date: formatDate(a.date),
      value: Math.round(
        (a.scores.data_readiness +
          a.scores.technology +
          a.scores.talent +
          a.scores.governance +
          a.scores.business_alignment) /
          5
      ),
    }));

  const averageScore = latestAssessment
    ? Math.round(
        (latestAssessment.scores.data_readiness +
          latestAssessment.scores.technology +
          latestAssessment.scores.talent +
          latestAssessment.scores.governance +
          latestAssessment.scores.business_alignment) /
          5
      )
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "info";
    if (score >= 40) return "warning";
    return "danger";
  };

  return (
    <div>
      <PageHeader
        title="Maturity Assessment"
        description="Evaluate your organization's readiness for AI transformation"
        icon={Target}
        actions={
          <Link href="/assessment/wizard">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        }
      />

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Target className="w-8 h-8 text-gray-400" />}
              title="No assessments yet"
              description="Start your first maturity assessment to establish a baseline for your AI transformation journey."
              action={
                <Link href="/assessment/wizard">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Assessment
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Overall Score"
              value={`${averageScore}%`}
              icon={Target}
            />
            <StatCard
              title="Assessments Completed"
              value={assessments.length}
              icon={FileText}
            />
            <StatCard
              title="Highest Pillar"
              value={`${Math.max(
                ...Object.values(latestAssessment?.scores || {})
              )}%`}
              icon={TrendingUp}
            />
            <StatCard
              title="Last Assessment"
              value={formatDate(latestAssessment?.date || new Date())}
              icon={Calendar}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Current Maturity Profile</CardTitle>
                <CardDescription>
                  Assessment from {formatDate(latestAssessment?.date || new Date())}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaturityRadarChart data={radarData} />
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Maturity Trend</CardTitle>
                <CardDescription>Overall score over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 1 ? (
                  <TrendChart data={trendData} valueFormatter={(v) => `${v}%`} />
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    Complete more assessments to see trends
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pillar Scorecards */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pillar Scores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {latestAssessment &&
              Object.entries(latestAssessment.scores).map(([key, value]) => (
                <Card key={key}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getScoreColor(value)}>{value}%</Badge>
                    </div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {key.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {pillarDescriptions[key]}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Recommendations */}
          {latestAssessment?.recommendations &&
            latestAssessment.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Key actions to improve your AI maturity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {latestAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Assessment History */}
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
            Assessment History
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Organization
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Overall Score
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment) => {
                      const score = Math.round(
                        (assessment.scores.data_readiness +
                          assessment.scores.technology +
                          assessment.scores.talent +
                          assessment.scores.governance +
                          assessment.scores.business_alignment) /
                          5
                      );
                      return (
                        <tr
                          key={assessment.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {formatDate(assessment.date)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {assessment.organization_name}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getScoreColor(score)}>{score}%</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/assessment/report/${assessment.id}`}>
                              <Button variant="ghost" size="sm">
                                View Report
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
