"use client";

import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  Modal,
} from "@/components/ui";
import {
  Boxes,
  Search,
  Download,
  ExternalLink,
  GitBranch,
  Bot,
  Cog,
  Zap,
  Shield,
  CheckCircle2,
  Code,
  TestTube,
  FileText,
  Workflow,
  Lock,
  Sparkles,
  Copy,
  BookOpen,
} from "lucide-react";
import { Blueprint } from "@/types";

const blueprints: Blueprint[] = [
  {
    id: "copilot-onboarding",
    name: "GitHub Copilot Team Onboarding",
    category: "adoption",
    description: "A comprehensive blueprint for rolling out GitHub Copilot across engineering teams. Includes training programs, best practices, and metrics tracking for successful adoption.",
    diagram: "copilot-onboarding",
    components: [
      {
        name: "License Management",
        type: "process",
        description: "Seat allocation and cost tracking by team/department",
        technologies: ["GitHub Admin", "Enterprise SSO", "Cost Center Tagging"],
      },
      {
        name: "Training Program",
        type: "training",
        description: "Structured learning path for developers",
        technologies: ["GitHub Skills", "Internal Workshops", "Prompt Engineering Course"],
      },
      {
        name: "Usage Monitoring",
        type: "metrics",
        description: "Track adoption and value metrics",
        technologies: ["Copilot Metrics API", "Custom Dashboards", "Quarterly Reviews"],
      },
      {
        name: "Best Practices Guide",
        type: "documentation",
        description: "Internal documentation for effective Copilot usage",
        technologies: ["Confluence", "Notion", "GitHub Wiki"],
      },
    ],
    best_practices: [
      "Start with pilot teams before full rollout",
      "Establish clear metrics for measuring success",
      "Create internal champions in each team",
      "Document organization-specific prompt patterns",
      "Hold weekly office hours during initial rollout",
      "Integrate Copilot training into onboarding for new hires",
    ],
    implementation_steps: [
      "Audit current development workflows and pain points",
      "Select pilot teams (mix of experience levels)",
      "Set up license management and cost tracking",
      "Deliver initial training sessions",
      "Establish feedback channels and office hours",
      "Measure baseline metrics before rollout",
      "Roll out to additional teams in phases",
      "Quarterly review and optimization",
    ],
  },
  {
    id: "ai-code-review",
    name: "AI-Assisted Code Review",
    category: "ci-cd",
    description: "Integrate AI tools into your code review process to catch bugs, improve code quality, and reduce reviewer burden. Combines automated checks with human oversight.",
    diagram: "ai-code-review",
    components: [
      {
        name: "PR Analysis Bot",
        type: "automation",
        description: "Automated PR summary and risk assessment",
        technologies: ["GitHub Actions", "CodeRabbit", "PR-Agent", "Copilot PR Summary"],
      },
      {
        name: "Security Scanner",
        type: "security",
        description: "AI-powered vulnerability detection",
        technologies: ["GitHub Advanced Security", "Snyk AI", "SonarQube"],
      },
      {
        name: "Code Quality Gate",
        type: "quality",
        description: "Automated quality checks and suggestions",
        technologies: ["Codacy", "DeepSource", "CodeClimate"],
      },
      {
        name: "Human Review Layer",
        type: "process",
        description: "Final human approval with AI insights",
        technologies: ["CODEOWNERS", "Review Assignment", "Approval Rules"],
      },
    ],
    best_practices: [
      "Use AI for first-pass review, humans for final approval",
      "Configure AI tools to match your style guide",
      "Set clear escalation paths for AI flagged issues",
      "Track AI accuracy and adjust configurations",
      "Don't let AI reviews replace human collaboration",
      "Document which AI suggestions to accept vs. customize",
    ],
    implementation_steps: [
      "Audit current code review bottlenecks",
      "Select AI tools that integrate with your Git provider",
      "Configure organization-specific rules and thresholds",
      "Set up GitHub Actions or CI pipeline integration",
      "Train team on interpreting AI review comments",
      "Establish metrics: review time, defect escape rate",
      "Iterate on AI configuration based on feedback",
    ],
  },
  {
    id: "ai-testing",
    name: "AI-Powered Test Generation",
    category: "testing",
    description: "Leverage AI to generate unit tests, identify edge cases, and maintain test coverage. Reduces time spent writing tests while improving coverage.",
    diagram: "ai-testing",
    components: [
      {
        name: "Test Generator",
        type: "automation",
        description: "AI-generated unit and integration tests",
        technologies: ["Copilot", "Codium AI", "Diffblue Cover", "TestPilot"],
      },
      {
        name: "Coverage Analyzer",
        type: "metrics",
        description: "Track and improve code coverage",
        technologies: ["Codecov", "Istanbul", "JaCoCo"],
      },
      {
        name: "Mutation Testing",
        type: "quality",
        description: "Validate test effectiveness",
        technologies: ["Stryker", "PIT", "mutmut"],
      },
      {
        name: "CI Integration",
        type: "automation",
        description: "Automated test runs on PR",
        technologies: ["GitHub Actions", "Jenkins", "CircleCI"],
      },
    ],
    best_practices: [
      "Review AI-generated tests for correctness",
      "Focus AI on boilerplate tests, humans on complex scenarios",
      "Maintain minimum coverage thresholds",
      "Use AI to suggest edge cases you might miss",
      "Combine with mutation testing for quality validation",
      "Keep test generation prompts in version control",
    ],
    implementation_steps: [
      "Assess current test coverage and gaps",
      "Select AI testing tools for your tech stack",
      "Configure test generation templates",
      "Integrate into PR workflow with coverage gates",
      "Train developers on effective test prompting",
      "Set up coverage tracking and reporting",
      "Establish review process for AI-generated tests",
    ],
  },
  {
    id: "ai-documentation",
    name: "AI Documentation Automation",
    category: "documentation",
    description: "Automate documentation generation and maintenance using AI. Keep API docs, READMEs, and internal docs up-to-date with code changes.",
    diagram: "ai-documentation",
    components: [
      {
        name: "Doc Generator",
        type: "automation",
        description: "Generate docs from code and comments",
        technologies: ["Copilot", "Mintlify", "ReadMe AI", "Swimm"],
      },
      {
        name: "API Documentation",
        type: "output",
        description: "OpenAPI/Swagger spec generation",
        technologies: ["TypeDoc", "Swagger", "Redoc"],
      },
      {
        name: "Change Detection",
        type: "automation",
        description: "Flag docs that need updates",
        technologies: ["GitHub Actions", "Docusaurus", "Custom Scripts"],
      },
      {
        name: "Doc Quality",
        type: "quality",
        description: "Lint and validate documentation",
        technologies: ["Vale", "Alex", "markdownlint"],
      },
    ],
    best_practices: [
      "Automate doc generation in CI/CD pipeline",
      "Use AI to generate first drafts, humans to refine",
      "Link docs to specific code versions",
      "Set up stale doc detection and alerts",
      "Include code examples generated by AI",
      "Maintain a doc style guide for AI consistency",
    ],
    implementation_steps: [
      "Audit existing documentation and gaps",
      "Select documentation tooling and AI assistants",
      "Configure auto-generation for API docs",
      "Set up CI hooks for doc validation",
      "Create templates for common doc types",
      "Train team on doc prompting and review",
      "Establish doc update cadence and ownership",
    ],
  },
  {
    id: "secure-ai-development",
    name: "Secure AI-Assisted Development",
    category: "security",
    description: "Framework for safely using AI coding tools in regulated or security-sensitive environments. Balances productivity with security and compliance requirements.",
    diagram: "secure-ai-dev",
    components: [
      {
        name: "Code Filtering",
        type: "security",
        description: "Block sensitive data from AI prompts",
        technologies: ["Copilot Trust Center", "DLP Tools", "GitLeaks"],
      },
      {
        name: "Audit Logging",
        type: "compliance",
        description: "Track AI tool usage for compliance",
        technologies: ["GitHub Audit Log", "SIEM Integration", "Custom Logging"],
      },
      {
        name: "IP Protection",
        type: "legal",
        description: "Manage code ownership and licensing",
        technologies: ["License Scanners", "Copilot Settings", "Policy Docs"],
      },
      {
        name: "Access Controls",
        type: "security",
        description: "Role-based AI tool access",
        technologies: ["GitHub Permissions", "Enterprise SSO", "Team Policies"],
      },
    ],
    best_practices: [
      "Configure code exclusion patterns for sensitive files",
      "Enable business version of AI tools (not consumer)",
      "Train developers on what NOT to include in prompts",
      "Regular audits of AI tool usage patterns",
      "Document AI usage in your security policies",
      "Use private model deployments for highest security needs",
    ],
    implementation_steps: [
      "Review compliance requirements (SOC2, HIPAA, etc.)",
      "Configure Copilot/AI tool enterprise settings",
      "Set up code exclusion patterns",
      "Enable audit logging and monitoring",
      "Document acceptable use policies",
      "Train team on secure AI usage",
      "Establish incident response for AI security issues",
    ],
  },
  {
    id: "ai-devops",
    name: "AI-Enhanced DevOps Pipeline",
    category: "ci-cd",
    description: "Integrate AI across your CI/CD pipeline for intelligent build optimization, deployment recommendations, and incident response.",
    diagram: "ai-devops",
    components: [
      {
        name: "Smart Build Cache",
        type: "optimization",
        description: "AI-optimized build caching and parallelization",
        technologies: ["Turborepo", "Nx", "Gradle Build Cache"],
      },
      {
        name: "Deployment Intelligence",
        type: "automation",
        description: "AI-powered deployment decisions",
        technologies: ["Harness AI", "LaunchDarkly", "Argo CD"],
      },
      {
        name: "Incident Response",
        type: "operations",
        description: "AI-assisted debugging and remediation",
        technologies: ["PagerDuty AI", "Datadog AI", "New Relic AI"],
      },
      {
        name: "Cost Optimization",
        type: "finops",
        description: "AI recommendations for resource efficiency",
        technologies: ["Kubecost", "CloudHealth", "Spot AI"],
      },
    ],
    best_practices: [
      "Start with build optimization for quick wins",
      "Use AI for rollback recommendations, not auto-rollback",
      "Correlate deployment changes with incidents",
      "Track AI recommendations vs. outcomes",
      "Human approval required for production deployments",
      "Regular review of AI-suggested optimizations",
    ],
    implementation_steps: [
      "Map current CI/CD pain points and bottlenecks",
      "Implement intelligent build caching",
      "Add AI-powered test selection (run affected tests)",
      "Set up deployment intelligence and recommendations",
      "Integrate incident correlation tools",
      "Configure alerting and human checkpoints",
      "Measure: build time, deploy frequency, MTTR",
    ],
  },
  {
    id: "prompt-engineering-patterns",
    name: "Engineering Prompt Patterns",
    category: "adoption",
    description: "A library of proven prompt patterns for common engineering tasks. Standardize AI usage across teams with templated, effective prompts.",
    diagram: "prompt-patterns",
    components: [
      {
        name: "Prompt Library",
        type: "documentation",
        description: "Curated prompts for common tasks",
        technologies: ["Internal Wiki", "Notion", "Prompt Manager"],
      },
      {
        name: "Code Generation Patterns",
        type: "templates",
        description: "Patterns for different code generation scenarios",
        technologies: ["Function Generation", "Refactoring", "Translation"],
      },
      {
        name: "Review Patterns",
        type: "templates",
        description: "Prompts for code review assistance",
        technologies: ["Bug Detection", "Performance Review", "Security Audit"],
      },
      {
        name: "Sharing Platform",
        type: "collaboration",
        description: "Team prompt sharing and voting",
        technologies: ["Slack Integration", "Teams Bot", "Custom App"],
      },
    ],
    best_practices: [
      "Document context that improves prompt effectiveness",
      "Include negative examples (what NOT to generate)",
      "Version control your prompt library",
      "Tag prompts by use case and effectiveness rating",
      "Encourage team contributions and feedback",
      "Regularly prune outdated or ineffective prompts",
    ],
    implementation_steps: [
      "Collect effective prompts from team members",
      "Categorize by use case (generation, review, debug)",
      "Create standardized prompt templates",
      "Set up sharing platform (wiki or custom tool)",
      "Establish contribution and review process",
      "Track usage and effectiveness metrics",
      "Regular prompt library reviews and updates",
    ],
  },
  {
    id: "ai-pair-programming",
    name: "AI Pair Programming Workflow",
    category: "adoption",
    description: "Best practices for effective human-AI pair programming. Maximize productivity while maintaining code quality and developer growth.",
    diagram: "ai-pair-programming",
    components: [
      {
        name: "Context Management",
        type: "process",
        description: "Strategies for providing effective context to AI",
        technologies: ["File References", "Comment Context", "Workspace Setup"],
      },
      {
        name: "Review Checkpoints",
        type: "quality",
        description: "When and how to review AI suggestions",
        technologies: ["Accept/Reject Patterns", "Inline Review", "Batch Review"],
      },
      {
        name: "Learning Integration",
        type: "development",
        description: "Using AI as a learning tool, not just productivity",
        technologies: ["Explain Code", "Alternative Solutions", "Best Practices"],
      },
      {
        name: "Metrics Tracking",
        type: "metrics",
        description: "Measure pair programming effectiveness",
        technologies: ["Acceptance Rate", "Time Saved", "Bug Introduction Rate"],
      },
    ],
    best_practices: [
      "Start with clear intent before accepting suggestions",
      "Review ALL generated code, especially security-sensitive",
      "Use AI explanations to learn new patterns",
      "Don't accept suggestions you don't understand",
      "Provide clear context in comments and file structure",
      "Track personal productivity patterns with AI",
    ],
    implementation_steps: [
      "Establish team guidelines for AI pair programming",
      "Configure IDE settings for optimal AI integration",
      "Train on context-providing techniques",
      "Set up personal metrics tracking",
      "Regular retrospectives on AI usage patterns",
      "Share learnings and effective techniques",
      "Adjust practices based on team feedback",
    ],
  },
];

const categoryIcons: Record<string, React.ElementType> = {
  adoption: Sparkles,
  "ci-cd": Workflow,
  testing: TestTube,
  documentation: FileText,
  security: Shield,
};

const categoryColors: Record<string, string> = {
  adoption: "from-purple-500 to-pink-500",
  "ci-cd": "from-blue-500 to-cyan-500",
  testing: "from-green-500 to-emerald-500",
  documentation: "from-orange-500 to-amber-500",
  security: "from-red-500 to-rose-500",
};

export default function BlueprintsPage() {
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const filteredBlueprints = blueprints.filter((bp) => {
    const matchesSearch =
      searchQuery === "" ||
      bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || bp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopyPrompt = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(id);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "adoption", label: "Adoption" },
    { id: "ci-cd", label: "CI/CD" },
    { id: "testing", label: "Testing" },
    { id: "documentation", label: "Documentation" },
    { id: "security", label: "Security" },
  ];

  // Sample prompts for the prompt library
  const samplePrompts = [
    {
      id: "unit-test",
      title: "Generate Unit Tests",
      prompt: "Write comprehensive unit tests for this function. Include edge cases, error scenarios, and use descriptive test names. Follow the AAA pattern (Arrange, Act, Assert).",
      category: "testing",
    },
    {
      id: "refactor",
      title: "Refactor for Readability",
      prompt: "Refactor this code to improve readability and maintainability. Extract functions where appropriate, use meaningful variable names, and add comments for complex logic.",
      category: "code",
    },
    {
      id: "security-review",
      title: "Security Review",
      prompt: "Review this code for security vulnerabilities. Check for: input validation, SQL injection, XSS, authentication issues, and sensitive data exposure. Provide specific recommendations.",
      category: "security",
    },
    {
      id: "api-docs",
      title: "Generate API Documentation",
      prompt: "Generate comprehensive API documentation for this endpoint including: description, parameters, request/response examples, error codes, and usage examples.",
      category: "documentation",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Engineering Blueprints"
        description="Reusable patterns for AI-assisted engineering workflows"
        icon={Boxes}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Tabs
          tabs={categories}
          activeTab={categoryFilter}
          onTabChange={setCategoryFilter}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blueprints.filter(b => b.category === "adoption").length}
              </p>
              <p className="text-sm text-gray-500">Adoption Guides</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Workflow className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blueprints.filter(b => b.category === "ci-cd").length}
              </p>
              <p className="text-sm text-gray-500">CI/CD Patterns</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TestTube className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blueprints.filter(b => b.category === "testing").length}
              </p>
              <p className="text-sm text-gray-500">Testing Guides</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {blueprints.filter(b => b.category === "security").length}
              </p>
              <p className="text-sm text-gray-500">Security Patterns</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredBlueprints.map((blueprint) => {
          const Icon = categoryIcons[blueprint.category] || Boxes;
          const colorClass = categoryColors[blueprint.category] || "from-gray-500 to-gray-600";
          return (
            <Card
              key={blueprint.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedBlueprint(blueprint)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="default" className="capitalize">
                    {blueprint.category.replace("-", "/")}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {blueprint.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                  {blueprint.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {blueprint.components.length} components
                  </span>
                  <span className="text-gray-500">
                    {blueprint.implementation_steps.length} steps
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBlueprints.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Boxes className="w-8 h-8 text-gray-400" />}
              title="No blueprints found"
              description="Try adjusting your search or filter criteria"
            />
          </CardContent>
        </Card>
      )}

      {/* Sample Prompts Section */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Code className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Prompt Templates</h2>
            <p className="text-sm text-gray-500">Copy and customize these prompts for common tasks</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {samplePrompts.map((prompt) => (
            <Card key={prompt.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{prompt.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPrompt(prompt.prompt, prompt.id);
                  }}
                >
                  {copiedPrompt === prompt.id ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg font-mono">
                {prompt.prompt}
              </p>
              <Badge variant="default" className="mt-2">
                {prompt.category}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Blueprint Detail Modal */}
      <Modal
        isOpen={!!selectedBlueprint}
        onClose={() => setSelectedBlueprint(null)}
        title={selectedBlueprint?.name || "Blueprint Details"}
        size="xl"
      >
        {selectedBlueprint && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
              <p className="text-gray-600">{selectedBlueprint.description}</p>
            </div>

            {/* Architecture Diagram Placeholder */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[selectedBlueprint.category]} flex items-center justify-center mb-4`}>
                  {(() => {
                    const Icon = categoryIcons[selectedBlueprint.category] || Boxes;
                    return <Icon className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <h4 className="font-medium text-gray-700 mb-2">Implementation Diagram</h4>
                <p className="text-sm text-gray-500">
                  Visual representation of the {selectedBlueprint.name}
                </p>
              </div>
            </div>

            {/* Components */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Key Components</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedBlueprint.components.map((component, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">{component.type}</Badge>
                      <h5 className="font-medium text-gray-900">{component.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {component.technologies.map((tech, techIdx) => (
                        <span
                          key={techIdx}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Best Practices</h4>
              <ul className="space-y-2">
                {selectedBlueprint.best_practices.map((practice, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Implementation Steps */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Implementation Steps</h4>
              <div className="space-y-3">
                {selectedBlueprint.implementation_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                View Full Guide
              </Button>
              <Button variant="primary" className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Start Implementation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
