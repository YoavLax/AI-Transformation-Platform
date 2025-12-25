"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@/components/ui";
import { MaturityRadarChart } from "@/components/charts";
import { Target, ArrowLeft, Download, Share2 } from "lucide-react";
import { Assessment } from "@/types";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export default function AssessmentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const assessments = getFromStorage<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
    const found = assessments.find((a) => a.id === id);
    setAssessment(found || null);
  }, [id]);

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Assessment not found</p>
      </div>
    );
  }

  const radarData = [
    { subject: "Data Readiness", value: assessment.scores.data_readiness, fullMark: 100 },
    { subject: "Technology", value: assessment.scores.technology, fullMark: 100 },
    { subject: "Talent", value: assessment.scores.talent, fullMark: 100 },
    { subject: "Governance", value: assessment.scores.governance, fullMark: 100 },
    { subject: "Business Alignment", value: assessment.scores.business_alignment, fullMark: 100 },
  ];

  const overallScore = Math.round(
    Object.values(assessment.scores).reduce((a, b) => a + b, 0) / 5
  );

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Leading", variant: "success" as const };
    if (score >= 60) return { label: "Advanced", variant: "info" as const };
    if (score >= 40) return { label: "Developing", variant: "warning" as const };
    return { label: "Beginning", variant: "danger" as const };
  };

  const pillarDetails: Record<string, { description: string; tips: string[] }> = {
    data_readiness: {
      description: "Measures the quality, accessibility, and infrastructure of your data assets.",
      tips: [
        "Implement data quality monitoring",
        "Establish data governance policies",
        "Invest in data infrastructure modernization",
      ],
    },
    technology: {
      description: "Assesses AI/ML platforms, tools, and cloud capabilities.",
      tips: [
        "Adopt cloud-native ML platforms",
        "Implement MLOps practices",
        "Evaluate and standardize AI tools",
      ],
    },
    talent: {
      description: "Evaluates AI skills, training programs, and expertise within the organization.",
      tips: [
        "Create AI learning paths for all roles",
        "Hire specialized AI talent",
        "Foster a culture of continuous learning",
      ],
    },
    governance: {
      description: "Reviews responsible AI practices, ethics, and risk management.",
      tips: [
        "Develop an AI ethics framework",
        "Implement model risk management",
        "Create audit trails for AI decisions",
      ],
    },
    business_alignment: {
      description: "Measures strategic vision and leadership commitment to AI.",
      tips: [
        "Align AI initiatives with business goals",
        "Secure executive sponsorship",
        "Define clear AI success metrics",
      ],
    },
  };

  return (
    <div>
      <PageHeader
        title="Assessment Report"
        description={`${assessment.organization_name} - ${formatDate(assessment.date)}`}
        icon={Target}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/assessment")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Executive Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                <span className="text-4xl font-bold text-white">{overallScore}%</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Overall Score</h3>
              <Badge variant={getScoreLabel(overallScore).variant} className="mt-2">
                {getScoreLabel(overallScore).label}
              </Badge>
            </div>
            <div className="flex-1">
              <MaturityRadarChart data={radarData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Details */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pillar Analysis</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {Object.entries(assessment.scores).map(([key, value]) => {
          const details = pillarDetails[key];
          const scoreInfo = getScoreLabel(value);
          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{key.replace(/_/g, " ")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{value}%</span>
                    <Badge variant={scoreInfo.variant}>{scoreInfo.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{details.description}</p>
                <h4 className="font-medium text-gray-900 mb-2">Improvement Tips:</h4>
                <ul className="space-y-2">
                  {details.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessment.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
