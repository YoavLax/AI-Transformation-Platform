"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Progress,
} from "@/components/ui";
import { Target, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Assessment, AssessmentScores } from "@/types";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface Question {
  id: string;
  pillar: keyof AssessmentScores;
  text: string;
  options: { value: number; label: string }[];
}

const questions: Question[] = [
  // Data Readiness
  {
    id: "dr1",
    pillar: "data_readiness",
    text: "How would you rate the quality and consistency of data across your organization?",
    options: [
      { value: 20, label: "Poor - Data is siloed and inconsistent" },
      { value: 40, label: "Basic - Some data quality initiatives exist" },
      { value: 60, label: "Developing - Data governance is being established" },
      { value: 80, label: "Advanced - Strong data quality practices" },
      { value: 100, label: "Leading - Enterprise-wide data excellence" },
    ],
  },
  {
    id: "dr2",
    pillar: "data_readiness",
    text: "What is the current state of your data infrastructure and pipelines?",
    options: [
      { value: 20, label: "Manual - Most processes are manual" },
      { value: 40, label: "Partial - Some automated pipelines" },
      { value: 60, label: "Developing - Modern data stack emerging" },
      { value: 80, label: "Advanced - Robust data infrastructure" },
      { value: 100, label: "Leading - Real-time, scalable pipelines" },
    ],
  },
  // Technology
  {
    id: "tech1",
    pillar: "technology",
    text: "What AI/ML tools and platforms are currently in use?",
    options: [
      { value: 20, label: "None - No AI/ML platforms" },
      { value: 40, label: "Experimenting - POC with basic tools" },
      { value: 60, label: "Developing - Cloud ML services adopted" },
      { value: 80, label: "Advanced - ML platforms in production" },
      { value: 100, label: "Leading - Full MLOps implementation" },
    ],
  },
  {
    id: "tech2",
    pillar: "technology",
    text: "How mature is your cloud infrastructure for AI workloads?",
    options: [
      { value: 20, label: "On-premise only - No cloud" },
      { value: 40, label: "Hybrid - Beginning cloud migration" },
      { value: 60, label: "Cloud-first - Most workloads in cloud" },
      { value: 80, label: "Cloud-native - Scalable infrastructure" },
      { value: 100, label: "Leading - Optimized for AI at scale" },
    ],
  },
  // Talent
  {
    id: "talent1",
    pillar: "talent",
    text: "What is the current AI/ML skill level in your organization?",
    options: [
      { value: 20, label: "Limited - Few or no AI practitioners" },
      { value: 40, label: "Growing - Small data science team" },
      { value: 60, label: "Developing - Cross-functional AI skills" },
      { value: 80, label: "Advanced - Strong AI center of excellence" },
      { value: 100, label: "Leading - AI skills across all levels" },
    ],
  },
  {
    id: "talent2",
    pillar: "talent",
    text: "How effective are your AI training and upskilling programs?",
    options: [
      { value: 20, label: "None - No formal programs" },
      { value: 40, label: "Ad-hoc - Occasional training" },
      { value: 60, label: "Structured - Regular training programs" },
      { value: 80, label: "Comprehensive - Clear learning paths" },
      { value: 100, label: "Leading - Continuous learning culture" },
    ],
  },
  // Governance
  {
    id: "gov1",
    pillar: "governance",
    text: "What responsible AI practices are in place?",
    options: [
      { value: 20, label: "None - No formal practices" },
      { value: 40, label: "Awareness - Beginning to consider ethics" },
      { value: 60, label: "Developing - Policies being drafted" },
      { value: 80, label: "Established - Clear governance framework" },
      { value: 100, label: "Leading - Industry-leading practices" },
    ],
  },
  {
    id: "gov2",
    pillar: "governance",
    text: "How mature is your AI risk management process?",
    options: [
      { value: 20, label: "None - No risk assessment" },
      { value: 40, label: "Basic - Ad-hoc risk reviews" },
      { value: 60, label: "Developing - Formal risk framework" },
      { value: 80, label: "Advanced - Continuous monitoring" },
      { value: 100, label: "Leading - Proactive risk mitigation" },
    ],
  },
  // Business Alignment
  {
    id: "bus1",
    pillar: "business_alignment",
    text: "How aligned is AI strategy with business objectives?",
    options: [
      { value: 20, label: "Disconnected - No clear AI strategy" },
      { value: 40, label: "Emerging - AI seen as IT initiative" },
      { value: 60, label: "Aligned - AI in business planning" },
      { value: 80, label: "Integrated - AI drives strategy" },
      { value: 100, label: "Leading - AI-first organization" },
    ],
  },
  {
    id: "bus2",
    pillar: "business_alignment",
    text: "What is the level of executive support for AI initiatives?",
    options: [
      { value: 20, label: "None - No executive sponsor" },
      { value: 40, label: "Limited - Some interest" },
      { value: 60, label: "Supportive - Executive backing" },
      { value: 80, label: "Champion - C-suite advocates" },
      { value: 100, label: "Leading - Board-level priority" },
    ],
  },
];

const steps = [
  { id: "info", title: "Organization Info" },
  { id: "data_readiness", title: "Data Readiness" },
  { id: "technology", title: "Technology" },
  { id: "talent", title: "Talent" },
  { id: "governance", title: "Governance" },
  { id: "business_alignment", title: "Business Alignment" },
  { id: "review", title: "Review & Submit" },
];

export default function AssessmentWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [organizationName, setOrganizationName] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentStepId = steps[currentStep].id;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculatePillarScore = (pillar: keyof AssessmentScores): number => {
    const pillarQuestions = questions.filter((q) => q.pillar === pillar);
    const answeredQuestions = pillarQuestions.filter((q) => answers[q.id] !== undefined);
    if (answeredQuestions.length === 0) return 0;
    const total = answeredQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    return Math.round(total / answeredQuestions.length);
  };

  const generateRecommendations = (scores: AssessmentScores): string[] => {
    const recommendations: string[] = [];

    if (scores.data_readiness < 60) {
      recommendations.push(
        "Invest in data quality initiatives and establish a data governance framework to improve data readiness."
      );
    }
    if (scores.technology < 60) {
      recommendations.push(
        "Evaluate and adopt modern ML platforms and cloud infrastructure to accelerate AI development."
      );
    }
    if (scores.talent < 60) {
      recommendations.push(
        "Develop comprehensive AI training programs and consider hiring specialized AI talent."
      );
    }
    if (scores.governance < 60) {
      recommendations.push(
        "Establish a responsible AI framework with clear policies, ethics guidelines, and risk management processes."
      );
    }
    if (scores.business_alignment < 60) {
      recommendations.push(
        "Strengthen executive sponsorship and integrate AI strategy with overall business objectives."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Continue to maintain and evolve your AI capabilities across all dimensions."
      );
    }

    return recommendations;
  };

  const handleSubmit = () => {
    const scores: AssessmentScores = {
      data_readiness: calculatePillarScore("data_readiness"),
      technology: calculatePillarScore("technology"),
      talent: calculatePillarScore("talent"),
      governance: calculatePillarScore("governance"),
      business_alignment: calculatePillarScore("business_alignment"),
    };

    const assessment: Assessment = {
      id: generateId(),
      organization_id: generateId(),
      organization_name: organizationName,
      date: new Date().toISOString(),
      scores,
      recommendations: generateRecommendations(scores),
    };

    const existing = getFromStorage<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
    setToStorage(STORAGE_KEYS.ASSESSMENTS, [assessment, ...existing]);

    router.push("/assessment");
  };

  const canProceed = () => {
    if (currentStepId === "info") {
      return organizationName.trim().length > 0;
    }
    if (currentStepId === "review") {
      return true;
    }
    const stepQuestions = questions.filter((q) => q.pillar === currentStepId);
    return stepQuestions.every((q) => answers[q.id] !== undefined);
  };

  const renderStepContent = () => {
    if (currentStepId === "info") {
      return (
        <div className="space-y-6">
          <Input
            label="Organization Name"
            placeholder="Enter your organization name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            This assessment will help you understand your organization&apos;s
            current AI maturity level across five key dimensions.
          </p>
        </div>
      );
    }

    if (currentStepId === "review") {
      const scores: AssessmentScores = {
        data_readiness: calculatePillarScore("data_readiness"),
        technology: calculatePillarScore("technology"),
        talent: calculatePillarScore("talent"),
        governance: calculatePillarScore("governance"),
        business_alignment: calculatePillarScore("business_alignment"),
      };

      const overallScore = Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / 5
      );

      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {overallScore}%
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Overall Maturity Score
            </h3>
          </div>

          <div className="space-y-4">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-gray-900">{value}%</span>
                </div>
                <Progress
                  value={value}
                  color={
                    value >= 80
                      ? "green"
                      : value >= 60
                      ? "blue"
                      : value >= 40
                      ? "yellow"
                      : "red"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const stepQuestions = questions.filter((q) => q.pillar === currentStepId);

    return (
      <div className="space-y-8">
        {stepQuestions.map((question, qIndex) => (
          <div key={question.id}>
            <h3 className="font-medium text-gray-900 mb-4">
              {qIndex + 1}. {question.text}
            </h3>
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    answers[question.id] === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={answers[question.id] === option.value}
                    onChange={() => handleAnswer(question.id, option.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[question.id] === option.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[question.id] === option.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="New Assessment"
        description="Complete the questionnaire to assess your AI maturity"
        icon={Target}
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? "flex-1" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? "bg-blue-600 text-white"
                    : index === currentStep
                    ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`text-xs ${
                index === currentStep ? "text-blue-600 font-medium" : "text-gray-400"
              }`}
              style={{ width: `${100 / steps.length}%`, textAlign: "center" }}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit}>
              <Check className="w-4 h-4 mr-2" />
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
