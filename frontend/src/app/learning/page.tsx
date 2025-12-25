"use client";

import { useState, useEffect } from "react";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  Progress,
  Modal,
} from "@/components/ui";
import {
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Play,
  FileText,
  MessageSquare,
  ClipboardList,
  Award,
} from "lucide-react";
import { LearningModule, LearningPath, ChangeTemplate } from "@/types";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";

// Sample learning content
const learningPaths: LearningPath[] = [
  {
    id: "executive",
    title: "AI for Executives",
    role: "executive",
    description: "Strategic overview of AI transformation for business leaders",
    modules: [
      {
        id: "exec-1",
        title: "AI Strategy Fundamentals",
        role: "executive",
        description: "Understanding AI's impact on business strategy",
        content: "This module covers the fundamentals of AI strategy, including market trends, competitive advantages, and strategic planning for AI adoption.",
        duration: 30,
        completed: false,
      },
      {
        id: "exec-2",
        title: "ROI and Value Measurement",
        role: "executive",
        description: "How to measure and communicate AI value",
        content: "Learn frameworks for measuring AI ROI, building business cases, and communicating value to stakeholders.",
        duration: 25,
        completed: false,
      },
      {
        id: "exec-3",
        title: "AI Governance for Leaders",
        role: "executive",
        description: "Building responsible AI practices",
        content: "Understand the importance of AI ethics, governance frameworks, and regulatory considerations.",
        duration: 20,
        completed: false,
      },
      {
        id: "exec-4",
        title: "Leading AI Transformation",
        role: "executive",
        description: "Change management and organizational readiness",
        content: "Strategies for leading organizational change, building AI culture, and managing transformation.",
        duration: 35,
        completed: false,
      },
    ],
    progress: 0,
  },
  {
    id: "manager",
    title: "AI for Managers",
    role: "manager",
    description: "Practical guide to managing AI projects and teams",
    modules: [
      {
        id: "mgr-1",
        title: "AI Project Management",
        role: "manager",
        description: "Managing AI projects effectively",
        content: "Best practices for planning, executing, and delivering AI projects on time and within budget.",
        duration: 40,
        completed: false,
      },
      {
        id: "mgr-2",
        title: "Building AI Teams",
        role: "manager",
        description: "Recruiting and developing AI talent",
        content: "How to hire, develop, and retain AI talent. Understanding roles and skill requirements.",
        duration: 30,
        completed: false,
      },
      {
        id: "mgr-3",
        title: "AI Use Case Identification",
        role: "manager",
        description: "Finding high-value AI opportunities",
        content: "Frameworks for identifying, prioritizing, and validating AI use cases in your domain.",
        duration: 35,
        completed: false,
      },
      {
        id: "mgr-4",
        title: "Stakeholder Management",
        role: "manager",
        description: "Managing expectations and communication",
        content: "Effective communication strategies for AI projects, managing stakeholder expectations.",
        duration: 25,
        completed: false,
      },
    ],
    progress: 0,
  },
  {
    id: "engineer",
    title: "AI for Engineers",
    role: "engineer",
    description: "Technical deep dive into AI/ML implementation",
    modules: [
      {
        id: "eng-1",
        title: "ML Fundamentals",
        role: "engineer",
        description: "Core machine learning concepts",
        content: "Deep dive into supervised, unsupervised, and reinforcement learning. Model selection and evaluation.",
        duration: 60,
        completed: false,
      },
      {
        id: "eng-2",
        title: "MLOps Best Practices",
        role: "engineer",
        description: "Production ML systems",
        content: "Building robust ML pipelines, CI/CD for ML, model monitoring and maintenance.",
        duration: 45,
        completed: false,
      },
      {
        id: "eng-3",
        title: "LLM Applications",
        role: "engineer",
        description: "Building with large language models",
        content: "RAG architectures, prompt engineering, fine-tuning, and deploying LLM applications.",
        duration: 50,
        completed: false,
      },
      {
        id: "eng-4",
        title: "Responsible AI Engineering",
        role: "engineer",
        description: "Building fair and safe AI systems",
        content: "Bias detection, fairness metrics, model interpretability, and safety considerations.",
        duration: 40,
        completed: false,
      },
    ],
    progress: 0,
  },
  {
    id: "analyst",
    title: "AI for Analysts",
    role: "analyst",
    description: "Data analysis and AI-assisted analytics",
    modules: [
      {
        id: "ana-1",
        title: "Data Preparation for AI",
        role: "analyst",
        description: "Preparing data for AI models",
        content: "Data cleaning, feature engineering, and creating AI-ready datasets.",
        duration: 35,
        completed: false,
      },
      {
        id: "ana-2",
        title: "AI-Powered Analytics",
        role: "analyst",
        description: "Using AI tools for analysis",
        content: "Leveraging AI tools for advanced analytics, predictive modeling, and insights generation.",
        duration: 40,
        completed: false,
      },
      {
        id: "ana-3",
        title: "Interpreting AI Results",
        role: "analyst",
        description: "Understanding model outputs",
        content: "How to interpret, validate, and communicate AI model results effectively.",
        duration: 30,
        completed: false,
      },
      {
        id: "ana-4",
        title: "AI Ethics for Analysts",
        role: "analyst",
        description: "Ethical considerations in analysis",
        content: "Understanding bias in data, ethical data usage, and responsible analytics.",
        duration: 25,
        completed: false,
      },
    ],
    progress: 0,
  },
];

const changeTemplates: ChangeTemplate[] = [
  {
    id: "comm-1",
    title: "AI Initiative Announcement",
    category: "communication",
    content: `Subject: Introducing [Initiative Name] - Our AI Transformation Journey

Dear Team,

I'm excited to announce the launch of [Initiative Name], a key part of our organization's AI transformation strategy.

**What is this initiative?**
[Brief description of the AI initiative and its goals]

**Why are we doing this?**
[Business drivers and expected benefits]

**What does this mean for you?**
[Impact on day-to-day work, training opportunities]

**Timeline:**
- Phase 1: [Date] - [Description]
- Phase 2: [Date] - [Description]

**How to get involved:**
[Call to action, contact information]

We're committed to supporting everyone through this transformation. Stay tuned for more updates.

Best regards,
[Leadership Name]`,
  },
  {
    id: "comm-2",
    title: "Monthly AI Update",
    category: "communication",
    content: `# AI Transformation Monthly Update - [Month Year]

## Highlights
- [Key achievement 1]
- [Key achievement 2]
- [Key achievement 3]

## Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Metric 1] | [X] | [Y] | ✅/⚠️/❌ |
| [Metric 2] | [X] | [Y] | ✅/⚠️/❌ |

## In Progress
- [Project 1]: [Status update]
- [Project 2]: [Status update]

## Coming Next Month
- [Upcoming milestone 1]
- [Upcoming milestone 2]

## How to Contribute
[Ways team members can get involved]

## Resources
- [Link to training materials]
- [Link to documentation]
- [Contact for questions]`,
  },
  {
    id: "stake-1",
    title: "Stakeholder Map Template",
    category: "stakeholder",
    content: `# Stakeholder Analysis for [AI Initiative]

## Key Stakeholders

### High Power / High Interest (Manage Closely)
| Stakeholder | Role | Interest | Engagement Strategy |
|-------------|------|----------|---------------------|
| [Name] | [Role] | [Their interest] | [How to engage] |

### High Power / Low Interest (Keep Satisfied)
| Stakeholder | Role | Interest | Engagement Strategy |
|-------------|------|----------|---------------------|
| [Name] | [Role] | [Their interest] | [How to engage] |

### Low Power / High Interest (Keep Informed)
| Stakeholder | Role | Interest | Engagement Strategy |
|-------------|------|----------|---------------------|
| [Name] | [Role] | [Their interest] | [How to engage] |

### Low Power / Low Interest (Monitor)
| Stakeholder | Role | Interest | Engagement Strategy |
|-------------|------|----------|---------------------|
| [Name] | [Role] | [Their interest] | [How to engage] |

## Communication Plan
[How and when to communicate with each group]

## Risk Mitigation
[Potential resistance and how to address it]`,
  },
  {
    id: "adopt-1",
    title: "AI Adoption Checklist",
    category: "adoption",
    content: `# AI Adoption Readiness Checklist

## Pre-Launch (4-6 weeks before)
- [ ] Executive sponsor identified
- [ ] Success metrics defined
- [ ] Training materials prepared
- [ ] Support channels established
- [ ] Communication plan finalized
- [ ] Pilot group identified
- [ ] Feedback mechanism in place

## Launch Week
- [ ] Kickoff communication sent
- [ ] Training sessions scheduled
- [ ] Help desk ready
- [ ] FAQ document published
- [ ] Quick start guides distributed
- [ ] Champions identified

## Post-Launch (First 30 days)
- [ ] Daily usage monitoring
- [ ] Weekly feedback collection
- [ ] Issue tracking and resolution
- [ ] Success stories captured
- [ ] Training completion tracked
- [ ] User satisfaction surveyed

## Sustained Adoption (Ongoing)
- [ ] Monthly usage reports
- [ ] Continuous training updates
- [ ] Best practices sharing
- [ ] ROI measurement
- [ ] Feature request collection
- [ ] Refresher training scheduled`,
  },
  {
    id: "adopt-2",
    title: "Training Program Template",
    category: "adoption",
    content: `# AI Training Program: [Tool/Initiative Name]

## Program Overview
**Duration:** [X weeks]
**Format:** [Online/In-person/Hybrid]
**Target Audience:** [Roles]

## Learning Objectives
By the end of this program, participants will be able to:
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

## Curriculum

### Week 1: Foundations
- Introduction to [Tool/Concept]
- Core features and capabilities
- Hands-on: First exercise

### Week 2: Intermediate Skills
- Advanced features
- Best practices
- Hands-on: Real-world scenario

### Week 3: Application
- Integration with existing workflows
- Troubleshooting common issues
- Hands-on: Project work

### Week 4: Mastery
- Advanced use cases
- Tips and tricks
- Final project presentation

## Assessment
- [ ] Pre-training assessment
- [ ] Module quizzes
- [ ] Hands-on exercises
- [ ] Final project
- [ ] Post-training assessment

## Support Resources
- Documentation: [Link]
- Video tutorials: [Link]
- Help desk: [Contact]
- Office hours: [Schedule]`,
  },
];

const roleIcons: Record<string, typeof Users> = {
  executive: Users,
  manager: ClipboardList,
  engineer: BookOpen,
  analyst: FileText,
  developer: BookOpen,
  "tech-lead": Users,
  architect: Users,
};

const roleColors: Record<string, string> = {
  executive: "from-purple-500 to-indigo-500",
  manager: "from-blue-500 to-cyan-500",
  engineer: "from-green-500 to-emerald-500",
  analyst: "from-orange-500 to-amber-500",
  developer: "from-green-500 to-emerald-500",
  "tech-lead": "from-blue-500 to-cyan-500",
  architect: "from-purple-500 to-indigo-500",
};

export default function LearningPage() {
  const [paths, setPaths] = useState<LearningPath[]>(learningPaths);
  const [activeTab, setActiveTab] = useState("paths");
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ChangeTemplate | null>(null);

  useEffect(() => {
    const stored = getFromStorage<LearningPath[] | null>(STORAGE_KEYS.LEARNING_PROGRESS, null);
    if (stored) {
      setPaths(stored);
    }
  }, []);

  const handleCompleteModule = (pathId: string, moduleId: string) => {
    const updated = paths.map((path) => {
      if (path.id === pathId) {
        const updatedModules = path.modules.map((m) =>
          m.id === moduleId ? { ...m, completed: true } : m
        );
        const completedCount = updatedModules.filter((m) => m.completed).length;
        return {
          ...path,
          modules: updatedModules,
          progress: Math.round((completedCount / updatedModules.length) * 100),
        };
      }
      return path;
    });
    setPaths(updated);
    setToStorage(STORAGE_KEYS.LEARNING_PROGRESS, updated);
    setSelectedModule(null);
  };

  const totalModules = paths.reduce((sum, p) => sum + p.modules.length, 0);
  const completedModules = paths.reduce(
    (sum, p) => sum + p.modules.filter((m) => m.completed).length,
    0
  );
  const totalDuration = paths.reduce(
    (sum, p) => sum + p.modules.reduce((s, m) => s + m.duration, 0),
    0
  );

  const tabs = [
    { id: "paths", label: "Learning Paths" },
    { id: "toolkit", label: "Change Toolkit" },
  ];

  return (
    <div>
      <PageHeader
        title="Learning & Change"
        description="Enable workforce adoption and AI literacy"
        icon={GraduationCap}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Learning Paths" value={paths.length} icon={BookOpen} />
        <StatCard title="Total Modules" value={totalModules} icon={FileText} />
        <StatCard
          title="Completed"
          value={`${completedModules}/${totalModules}`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Duration"
          value={`${Math.round(totalDuration / 60)}h`}
          icon={Clock}
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {activeTab === "paths" && (
        <>
          {/* Learning Paths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {paths.map((path) => {
              const Icon = roleIcons[path.role];
              const colorClass = roleColors[path.role];
              return (
                <Card
                  key={path.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPath(path)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{path.title}</h3>
                          <Badge variant="default" className="capitalize">
                            {path.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{path.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <span>{path.modules.length} modules</span>
                          <span>
                            {path.modules.reduce((s, m) => s + m.duration, 0)} min total
                          </span>
                        </div>
                        <Progress value={path.progress} showLabel color="green" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your learning journey across all paths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paths.map((path) => (
                  <div key={path.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700">{path.title}</div>
                    <div className="flex-1">
                      <Progress value={path.progress} color="blue" />
                    </div>
                    <div className="w-16 text-sm text-gray-500 text-right">{path.progress}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "toolkit" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <MessageSquare className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Communication</h3>
                <p className="text-sm text-gray-600">
                  Templates for announcements, updates, and stakeholder communication
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-6">
                <Users className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Stakeholder Management</h3>
                <p className="text-sm text-gray-600">
                  Tools for mapping and managing stakeholder relationships
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <ClipboardList className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Adoption</h3>
                <p className="text-sm text-gray-600">
                  Checklists and templates for driving user adoption
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>Ready-to-use templates for change management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {changeTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="info" className="capitalize">
                        {template.category}
                      </Badge>
                      <h4 className="font-medium text-gray-900">{template.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      Click to view and copy the template
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Learning Path Detail Modal */}
      <Modal
        isOpen={!!selectedPath}
        onClose={() => setSelectedPath(null)}
        title={selectedPath?.title || "Learning Path"}
        size="xl"
      >
        {selectedPath && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">{selectedPath.description}</p>
              <Badge variant="default" className="capitalize">
                {selectedPath.role}
              </Badge>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedPath.progress}%</p>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
              <div className="flex-1">
                <Progress value={selectedPath.progress} color="green" />
              </div>
              <Award className="w-8 h-8 text-amber-500" />
            </div>

            <div className="space-y-3">
              {selectedPath.modules.map((module, idx) => (
                <div
                  key={module.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    module.completed
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedModule(module)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        module.completed
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {module.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                      <p className="text-sm text-gray-500">{module.description}</p>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.duration} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Module Detail Modal */}
      <Modal
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
        title={selectedModule?.title || "Module"}
        size="lg"
      >
        {selectedModule && selectedPath && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="capitalize">
                {selectedModule.role}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedModule.duration} minutes
              </span>
            </div>

            <p className="text-gray-600">{selectedModule.description}</p>

            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Module Content</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedModule.content}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedModule(null)}>
                Close
              </Button>
              {!selectedModule.completed && (
                <Button
                  onClick={() => handleCompleteModule(selectedPath.id, selectedModule.id)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Template Detail Modal */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.title || "Template"}
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <Badge variant="info" className="capitalize">
              {selectedTemplate.category}
            </Badge>

            <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {selectedTemplate.content}
              </pre>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedTemplate.content);
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
