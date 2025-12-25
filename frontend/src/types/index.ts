// AI Assistant/Vendor Types
export interface AIAssistant {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: 'code-assistant' | 'chat' | 'documentation' | 'testing' | 'security' | 'other';
  monthly_price: number;
  licenses: number;
  active_users: number;
  contract_start: string;
  contract_end: string;
  status: 'active' | 'trial' | 'pending' | 'cancelled';
  features: string[];
  created_at: string;
}

// AI Initiative Types
export interface Risk {
  id?: string;
  category: 'security' | 'compliance' | 'data-privacy' | 'vendor-lock-in' | 'cost' | 'adoption' | 'bias' | 'operational' | 'privacy';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
  owner?: string;
  status?: 'open' | 'mitigated' | 'accepted';
}

export interface AIInitiative {
  id: string;
  title: string;
  description: string;
  team: string;
  sponsor: string;
  status: 'planning' | 'pilot' | 'rollout' | 'active' | 'on-hold' | 'completed';
  start_date: string;
  target_date: string;
  ai_assistants: string[]; // IDs of AI assistants used
  objectives: string[];
  risks: Risk[];
  progress: number;
  created_at: string;
  updated_at: string;
}

// Usage Metrics Types (GitHub Copilot focused)
export interface CopilotMetrics {
  id: string;
  team: string;
  period: string; // YYYY-MM format
  active_users: number;
  total_licenses: number;
  acceptance_rate: number; // percentage
  suggestions_accepted: number;
  suggestions_shown: number;
  lines_of_code_generated: number;
  languages: { language: string; percentage: number }[];
  chat_interactions: number;
  time_saved_hours: number;
  recorded_at: string;
}

export interface TeamMetrics {
  team: string;
  current_month: CopilotMetrics;
  trend: 'up' | 'down' | 'stable';
  adoption_rate: number;
}

// Team AI Maturity Types
export interface MaturityScores {
  adoption: number; // How many team members actively use AI tools
  proficiency: number; // How effectively they use AI tools
  integration: number; // How well AI is integrated into workflows
  governance: number; // Following best practices and policies
  innovation: number; // Experimenting with new AI capabilities
}

export interface TeamMaturity {
  id: string;
  team: string;
  department: string;
  assessment_date: string;
  scores: MaturityScores;
  overall_level: 'novice' | 'developing' | 'proficient' | 'advanced' | 'leading';
  strengths: string[];
  improvement_areas: string[];
  recommendations: string[];
  assessor: string;
}

// Value Tracking Types
export interface ValueRecord {
  id: string;
  initiative_id?: string;
  initiative_title?: string;
  team: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  period: string;
  notes?: string;
  created_at: string;
}

export interface ROICalculation {
  initiative_id: string;
  investment: number;
  returns: number;
  roi_percentage: number;
  payback_months: number;
}

// Blueprint Types
export interface BlueprintComponent {
  name: string;
  type: string;
  description: string;
  technologies: string[];
}

export interface Blueprint {
  id: string;
  name: string;
  category: 'code-assistant' | 'code' | 'rag' | 'automation' | 'testing' | 'devops' | 'security' | 'adoption' | 'review' | 'documentation' | 'prompts' | 'ci-cd';
  description: string;
  diagram: string;
  components: BlueprintComponent[];
  best_practices: string[];
  implementation_steps: string[];
  use_cases?: string[];
}

// Learning Types
export interface LearningModule {
  id: string;
  title: string;
  role: 'developer' | 'tech-lead' | 'manager' | 'architect' | 'executive' | 'engineer' | 'analyst';
  description: string;
  content: string;
  duration: number;
  completed: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  role: 'developer' | 'tech-lead' | 'manager' | 'architect' | 'executive' | 'engineer' | 'analyst';
  description: string;
  modules: LearningModule[];
  progress: number;
}

export interface ChangeTemplate {
  id: string;
  title: string;
  category: 'onboarding' | 'best-practices' | 'policy' | 'training' | 'communication' | 'stakeholder' | 'adoption';
  content: string;
}

// Model Card / AI Governance Types
export interface ModelCard {
  id: string;
  model_name: string;
  version: string;
  purpose: string;
  owner: string;
  training_data: string;
  evaluation_metrics: string[];
  risks: Risk[];
  mitigations: string[];
  created_at: string;
  updated_at: string;
}

// Use Case Types
export interface UseCase {
  id: string;
  title: string;
  description: string;
  department: string;
  problem_statement: string;
  expected_outcomes: string;
  data_availability: 'high' | 'medium' | 'low';
  impact_score: number;
  feasibility_score: number;
  risk_score: number;
  timeline_estimate: string;
  status: 'draft' | 'submitted' | 'approved' | 'in_progress' | 'completed';
  created_at: string;
}

// Assessment Types (for org-level AI readiness)
export interface AssessmentScores {
  data_readiness: number;
  technology: number;
  talent: number;
  governance: number;
  business_alignment: number;
}

export interface Assessment {
  id: string;
  name?: string;
  organization_id?: string;
  organization_name: string;
  date: string;
  scores: AssessmentScores;
  overall_score?: number;
  strengths?: string[];
  improvements?: string[];
  recommendations: string[];
  created_at?: string;
}
