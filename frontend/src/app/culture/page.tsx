"use client";

import { useState, useMemo } from "react";
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
  Modal,
  Input,
  Select,
  Progress,
} from "@/components/ui";
import {
  Sparkles,
  Plus,
  Users,
  Calendar,
  Trophy,
  CheckCircle2,
  Star,
  Award,
  Building2,
  UserCheck,
  Lightbulb,
  Rocket,
  Edit,
  Trash2,
  Flag,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getFromStorage, setToStorage } from "@/lib/storage";
import { generateId, formatDate } from "@/lib/utils";

// Types
type MilestoneStatus = "not_started" | "in_progress" | "completed";
type MilestoneCategory = "guild" | "workshop" | "hackathon" | "champions" | "training" | "governance";

interface AIMilestone {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  targetDate: string;
  completedDate?: string;
  owner: string;
  impact: "high" | "medium" | "low";
  notes?: string;
}

interface AIChampion {
  id: string;
  name: string;
  team: string;
  role: string;
  certifiedDate: string;
  specializations: string[];
  initiativesLed: number;
  menteeCount: number;
}

interface AIEvent {
  id: string;
  title: string;
  type: "workshop" | "hackathon" | "guild_meeting" | "training" | "demo_day";
  date: string;
  attendees: number;
  description: string;
  outcomes?: string[];
}

interface CultureMaturityDimension {
  dimension: string;
  score: number;
  target: number;
}

// Constants
const MILESTONE_CATEGORIES: { value: MilestoneCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "guild", label: "AI Guild", icon: <Users className="w-4 h-4" />, color: "purple" },
  { value: "workshop", label: "Workshops", icon: <Lightbulb className="w-4 h-4" />, color: "blue" },
  { value: "hackathon", label: "Hackathons", icon: <Trophy className="w-4 h-4" />, color: "yellow" },
  { value: "champions", label: "AI Champions", icon: <Star className="w-4 h-4" />, color: "green" },
  { value: "training", label: "Training Programs", icon: <Award className="w-4 h-4" />, color: "orange" },
  { value: "governance", label: "Governance", icon: <Building2 className="w-4 h-4" />, color: "red" },
];

const MATURITY_LEVELS = [
  { level: 1, name: "Initial", description: "Ad-hoc AI usage, no formal structure", color: "red" },
  { level: 2, name: "Developing", description: "Some initiatives started, early adoption", color: "orange" },
  { level: 3, name: "Defined", description: "Formal programs in place, growing adoption", color: "yellow" },
  { level: 4, name: "Managed", description: "Measured progress, widespread adoption", color: "blue" },
  { level: 5, name: "Optimizing", description: "AI-native culture, continuous innovation", color: "green" },
];

const SAMPLE_MILESTONES: AIMilestone[] = [];

const SAMPLE_CHAMPIONS: AIChampion[] = [];

const SAMPLE_EVENTS: AIEvent[] = [];

const SAMPLE_MATURITY: CultureMaturityDimension[] = [];

// Helper function to get initial data from storage or use sample data
function getInitialData<T>(storageKey: string, sampleData: T[]): T[] {
  if (typeof window === "undefined") return sampleData;
  const stored = getFromStorage<T[]>(storageKey, []);
  if (stored.length > 0) return stored;
  // Initialize storage with sample data
  setToStorage(storageKey, sampleData);
  return sampleData;
}

export default function AICulturePage() {
  const [milestones, setMilestones] = useState<AIMilestone[]>(() => 
    getInitialData("ai_culture_milestones", SAMPLE_MILESTONES)
  );
  const [champions, setChampions] = useState<AIChampion[]>(() => 
    getInitialData("ai_culture_champions", SAMPLE_CHAMPIONS)
  );
  const [events, setEvents] = useState<AIEvent[]>(() => 
    getInitialData("ai_culture_events", SAMPLE_EVENTS)
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [maturityData, setMaturityData] = useState<CultureMaturityDimension[]>(() => 
    getInitialData("ai_culture_maturity", SAMPLE_MATURITY)
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<AIMilestone | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | "all">("all");

  const [milestoneForm, setMilestoneForm] = useState<Partial<AIMilestone>>({
    title: "",
    description: "",
    category: "guild",
    status: "not_started",
    targetDate: "",
    owner: "",
    impact: "medium",
  });

  const [championForm, setChampionForm] = useState<Partial<AIChampion>>({
    name: "",
    team: "",
    role: "",
    certifiedDate: new Date().toISOString().split("T")[0],
    specializations: [],
    initiativesLed: 0,
    menteeCount: 0,
  });

  const [eventForm, setEventForm] = useState<Partial<AIEvent>>({
    title: "",
    type: "workshop",
    date: "",
    attendees: 0,
    description: "",
  });

  // Calculate overall maturity level
  const overallMaturityScore = useMemo(() => {
    if (maturityData.length === 0) return 0;
    return Math.round(maturityData.reduce((sum, d) => sum + d.score, 0) / maturityData.length);
  }, [maturityData]);

  const maturityLevel = useMemo(() => {
    if (overallMaturityScore >= 85) return MATURITY_LEVELS[4];
    if (overallMaturityScore >= 70) return MATURITY_LEVELS[3];
    if (overallMaturityScore >= 55) return MATURITY_LEVELS[2];
    if (overallMaturityScore >= 40) return MATURITY_LEVELS[1];
    return MATURITY_LEVELS[0];
  }, [overallMaturityScore]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    if (categoryFilter === "all") return milestones;
    return milestones.filter((m) => m.category === categoryFilter);
  }, [milestones, categoryFilter]);

  // Stats
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;
  const totalChampions = champions.length;
  const totalEvents = events.length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees, 0);

  // Handlers
  const handleSaveMilestone = () => {
    if (editingMilestone) {
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id ? { ...m, ...milestoneForm } : m
      );
      setMilestones(updated);
      setToStorage("ai_culture_milestones", updated);
    } else {
      const newMilestone: AIMilestone = {
        id: generateId(),
        title: milestoneForm.title || "",
        description: milestoneForm.description || "",
        category: milestoneForm.category as MilestoneCategory,
        status: milestoneForm.status as MilestoneStatus,
        targetDate: milestoneForm.targetDate || "",
        owner: milestoneForm.owner || "",
        impact: milestoneForm.impact as "high" | "medium" | "low",
        notes: milestoneForm.notes,
      };
      const updated = [newMilestone, ...milestones];
      setMilestones(updated);
      setToStorage("ai_culture_milestones", updated);
    }
    setShowMilestoneModal(false);
    setEditingMilestone(null);
    resetMilestoneForm();
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    setToStorage("ai_culture_milestones", updated);
  };

  const handleEditMilestone = (milestone: AIMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm(milestone);
    setShowMilestoneModal(true);
  };

  const handleUpdateMilestoneStatus = (id: string, status: MilestoneStatus) => {
    const updated = milestones.map((m) =>
      m.id === id
        ? {
            ...m,
            status,
            completedDate: status === "completed" ? new Date().toISOString() : undefined,
          }
        : m
    );
    setMilestones(updated);
    setToStorage("ai_culture_milestones", updated);
  };

  const handleSaveChampion = () => {
    const newChampion: AIChampion = {
      id: generateId(),
      name: championForm.name || "",
      team: championForm.team || "",
      role: championForm.role || "",
      certifiedDate: championForm.certifiedDate || new Date().toISOString(),
      specializations: championForm.specializations || [],
      initiativesLed: championForm.initiativesLed || 0,
      menteeCount: championForm.menteeCount || 0,
    };
    const updated = [newChampion, ...champions];
    setChampions(updated);
    setToStorage("ai_culture_champions", updated);
    setShowChampionModal(false);
    resetChampionForm();
  };

  const handleSaveEvent = () => {
    const newEvent: AIEvent = {
      id: generateId(),
      title: eventForm.title || "",
      type: eventForm.type as AIEvent["type"],
      date: eventForm.date || "",
      attendees: eventForm.attendees || 0,
      description: eventForm.description || "",
      outcomes: [],
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    setToStorage("ai_culture_events", updated);
    setShowEventModal(false);
    resetEventForm();
  };

  const resetMilestoneForm = () => {
    setMilestoneForm({
      title: "",
      description: "",
      category: "guild",
      status: "not_started",
      targetDate: "",
      owner: "",
      impact: "medium",
    });
  };

  const resetChampionForm = () => {
    setChampionForm({
      name: "",
      team: "",
      role: "",
      certifiedDate: new Date().toISOString().split("T")[0],
      specializations: [],
      initiativesLed: 0,
      menteeCount: 0,
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      type: "workshop",
      date: "",
      attendees: 0,
      description: "",
    });
  };

  const getStatusColor = (status: MilestoneStatus): "success" | "info" | "default" => {
    const colors: Record<MilestoneStatus, "success" | "info" | "default"> = {
      completed: "success",
      in_progress: "info",
      not_started: "default",
    };
    return colors[status];
  };

  const getImpactColor = (impact: string): "danger" | "warning" | "default" => {
    const colors: Record<string, "danger" | "warning" | "default"> = {
      high: "danger",
      medium: "warning",
      low: "default",
    };
    return colors[impact] || "default";
  };

  const getCategoryInfo = (category: MilestoneCategory) => {
    return MILESTONE_CATEGORIES.find((c) => c.value === category);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Milestones" },
    { id: "champions", label: "AI Champions" },
    { id: "events", label: "Events & Activities" },
  ];

  const categoryOptions = [
    { value: "", label: "Select Category" },
    ...MILESTONE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];

  const statusOptions = [
    { value: "not_started", label: "Not Started" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const impactOptions = [
    { value: "high", label: "High Impact" },
    { value: "medium", label: "Medium Impact" },
    { value: "low", label: "Low Impact" },
  ];

  const eventTypeOptions = [
    { value: "workshop", label: "Workshop" },
    { value: "hackathon", label: "Hackathon" },
    { value: "guild_meeting", label: "Guild Meeting" },
    { value: "training", label: "Training" },
    { value: "demo_day", label: "Demo Day" },
  ];

  const teamOptions = [
    { value: "", label: "Select Team" },
    { value: "Platform Team", label: "Platform Team" },
    { value: "Backend Team", label: "Backend Team" },
    { value: "Frontend Team", label: "Frontend Team" },
    { value: "DevOps", label: "DevOps" },
    { value: "Mobile Team", label: "Mobile Team" },
    { value: "Data Team", label: "Data Team" },
    { value: "QA Team", label: "QA Team" },
    { value: "Security Team", label: "Security Team" },
  ];

  // Chart data for milestones by category
  const milestoneByCategoryData = MILESTONE_CATEGORIES.map((cat) => ({
    name: cat.label,
    completed: milestones.filter((m) => m.category === cat.value && m.status === "completed").length,
    inProgress: milestones.filter((m) => m.category === cat.value && m.status === "in_progress").length,
    notStarted: milestones.filter((m) => m.category === cat.value && m.status === "not_started").length,
  }));

  return (
    <div>
      <PageHeader
        title="AI Culture & Transformation"
        description="Build an AI-native engineering organization"
        icon={Sparkles}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEventModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Add Event
            </Button>
            <Button onClick={() => setShowMilestoneModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        }
      />

      {/* Company Maturity Level Banner */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${maturityLevel.color}-400 to-${maturityLevel.color}-600 flex items-center justify-center`}>
                <span className="text-3xl font-bold text-white">{maturityLevel.level}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Company AI Maturity Level</p>
                <h2 className="text-2xl font-bold text-gray-900">{maturityLevel.name}</h2>
                <p className="text-sm text-gray-600">{maturityLevel.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{overallMaturityScore}%</p>
                <p className="text-sm text-gray-500">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{completedMilestones}</p>
                <p className="text-sm text-gray-500">Milestones Done</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{totalChampions}</p>
                <p className="text-sm text-gray-500">AI Champions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Milestones"
          value={milestones.length}
          icon={Flag}
        />
        <StatCard
          title="In Progress"
          value={inProgressMilestones}
          icon={Rocket}
        />
        <StatCard
          title="Total Events"
          value={totalEvents}
          icon={Calendar}
        />
        <StatCard
          title="Total Participants"
          value={totalAttendees}
          icon={Users}
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Maturity Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>AI Culture Maturity</CardTitle>
                <CardDescription>Assessment across key dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={maturityData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Current"
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Milestones by Category</CardTitle>
                <CardDescription>Progress across transformation areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={milestoneByCategoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                      <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="In Progress" />
                      <Bar dataKey="notStarted" stackId="a" fill="#e5e7eb" name="Not Started" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maturity Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Maturity Level Journey</CardTitle>
              <CardDescription>Your path to AI-native engineering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                {MATURITY_LEVELS.map((level, idx) => (
                  <div key={level.level} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        level.level <= maturityLevel.level
                          ? `bg-${level.color}-500 text-white`
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {level.level}
                    </div>
                    <p className={`text-sm font-medium mt-2 ${level.level === maturityLevel.level ? "text-purple-600" : "text-gray-500"}`}>
                      {level.name}
                    </p>
                    {idx < MATURITY_LEVELS.length - 1 && (
                      <div className="absolute h-1 w-full bg-gray-200" style={{ top: "24px", left: "50%", width: "100%" }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {maturityData.map((dim) => (
                  <div key={dim.dimension} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-medium text-gray-700">{dim.dimension}</div>
                    <div className="flex-1">
                      <Progress value={dim.score} max={100} color={dim.score >= dim.target ? "green" : "blue"} />
                    </div>
                    <div className="w-20 text-sm text-gray-500 text-right">
                      {dim.score}% / {dim.target}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Milestones</CardTitle>
                <CardDescription>Next transformation milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones
                    .filter((m) => m.status !== "completed")
                    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
                    .slice(0, 4)
                    .map((milestone) => {
                      const catInfo = getCategoryInfo(milestone.category);
                      return (
                        <div
                          key={milestone.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                        >
                          <div className={`p-2 rounded-lg bg-${catInfo?.color}-100`}>
                            {catInfo?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{milestone.title}</h4>
                            <p className="text-sm text-gray-500">{milestone.owner}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(milestone.status)}>
                              {milestone.status.replace("_", " ")}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(milestone.targetDate)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Latest AI culture activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 4)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="p-2 rounded-lg bg-blue-100">
                          {event.type === "hackathon" ? (
                            <Trophy className="w-4 h-4 text-blue-600" />
                          ) : event.type === "workshop" ? (
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Calendar className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                          <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                        </div>
                        <Badge variant="default">{event.attendees} attendees</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Categories
            </Button>
            {MILESTONE_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={categoryFilter === cat.value ? "primary" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.icon}
                <span className="ml-1">{cat.label}</span>
              </Button>
            ))}
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            {filteredMilestones.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Flag className="w-8 h-8 text-gray-400" />}
                    title="No milestones found"
                    description="Add your first AI transformation milestone"
                    action={
                      <Button onClick={() => setShowMilestoneModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Milestone
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              filteredMilestones.map((milestone) => {
                const catInfo = getCategoryInfo(milestone.category);
                return (
                  <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-${catInfo?.color}-100`}>
                          {catInfo?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                            <Badge variant={getStatusColor(milestone.status)}>
                              {milestone.status.replace("_", " ")}
                            </Badge>
                            <Badge variant={getImpactColor(milestone.impact)}>
                              {milestone.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4" />
                              {milestone.owner}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Target: {formatDate(milestone.targetDate)}
                            </span>
                            {milestone.completedDate && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed: {formatDate(milestone.completedDate)}
                              </span>
                            )}
                          </div>
                          {milestone.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">&ldquo;{milestone.notes}&rdquo;</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {milestone.status !== "completed" && (
                            <Select
                              options={statusOptions}
                              value={milestone.status}
                              onChange={(e) => handleUpdateMilestoneStatus(milestone.id, e.target.value as MilestoneStatus)}
                              className="text-xs"
                            />
                          )}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditMilestone(milestone)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(milestone.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "champions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Champions Network</h3>
              <p className="text-sm text-gray-500">Certified AI advocates driving adoption in their teams</p>
            </div>
            <Button onClick={() => setShowChampionModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Champion
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {champions.map((champion) => (
              <Card key={champion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {champion.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{champion.name}</h4>
                      <p className="text-sm text-gray-500">{champion.role}</p>
                      <Badge variant="default" className="mt-1">{champion.team}</Badge>
                    </div>
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {champion.specializations.map((spec, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Rocket className="w-4 h-4" />
                        {champion.initiativesLed} initiatives
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" />
                        {champion.menteeCount} mentees
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Certified: {formatDate(champion.certifiedDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Champion Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Champion Network Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{champions.length}</p>
                  <p className="text-sm text-gray-500">Active Champions</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {new Set(champions.map((c) => c.team)).size}
                  </p>
                  <p className="text-sm text-gray-500">Teams Covered</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {champions.reduce((sum, c) => sum + c.initiativesLed, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Initiatives Led</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">
                    {champions.reduce((sum, c) => sum + c.menteeCount, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Developers Mentored</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Events & Activities</h3>
              <p className="text-sm text-gray-500">Workshops, hackathons, and guild meetings</p>
            </div>
            <Button onClick={() => setShowEventModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          event.type === "hackathon"
                            ? "bg-yellow-100"
                            : event.type === "workshop"
                            ? "bg-blue-100"
                            : event.type === "demo_day"
                            ? "bg-purple-100"
                            : "bg-gray-100"
                        }`}>
                          {event.type === "hackathon" ? (
                            <Trophy className="w-5 h-5 text-yellow-600" />
                          ) : event.type === "workshop" ? (
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                          ) : event.type === "demo_day" ? (
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <Badge variant="default" className="capitalize">
                            {event.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{event.attendees}</p>
                        <p className="text-xs text-gray-500">attendees</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.date)}
                    </div>
                    {event.outcomes && event.outcomes.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Outcomes:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.outcomes.map((outcome, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              {outcome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Add/Edit Milestone Modal */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          setEditingMilestone(null);
          resetMilestoneForm();
        }}
        title={editingMilestone ? "Edit Milestone" : "Add AI Transformation Milestone"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Milestone Title"
            placeholder="e.g., Launch AI Guild"
            value={milestoneForm.title || ""}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={milestoneForm.category || ""}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, category: e.target.value as MilestoneCategory })}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={milestoneForm.status || ""}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value as MilestoneStatus })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Date"
              type="date"
              value={milestoneForm.targetDate || ""}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
            />
            <Select
              label="Impact"
              options={impactOptions}
              value={milestoneForm.impact || ""}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, impact: e.target.value as "high" | "medium" | "low" })}
            />
          </div>
          <Input
            label="Owner"
            placeholder="e.g., Engineering Leadership"
            value={milestoneForm.owner || ""}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, owner: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe the milestone and its objectives..."
              value={milestoneForm.description || ""}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            />
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Additional context or progress notes"
            value={milestoneForm.notes || ""}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowMilestoneModal(false);
                setEditingMilestone(null);
                resetMilestoneForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMilestone}>
              {editingMilestone ? "Save Changes" : "Add Milestone"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Champion Modal */}
      <Modal
        isOpen={showChampionModal}
        onClose={() => {
          setShowChampionModal(false);
          resetChampionForm();
        }}
        title="Add AI Champion"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Full name"
            value={championForm.name || ""}
            onChange={(e) => setChampionForm({ ...championForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Team"
              options={teamOptions}
              value={championForm.team || ""}
              onChange={(e) => setChampionForm({ ...championForm, team: e.target.value })}
            />
            <Input
              label="Role"
              placeholder="e.g., Senior Engineer"
              value={championForm.role || ""}
              onChange={(e) => setChampionForm({ ...championForm, role: e.target.value })}
            />
          </div>
          <Input
            label="Certification Date"
            type="date"
            value={championForm.certifiedDate || ""}
            onChange={(e) => setChampionForm({ ...championForm, certifiedDate: e.target.value })}
          />
          <Input
            label="Specializations (comma-separated)"
            placeholder="GitHub Copilot, Prompt Engineering"
            value={(championForm.specializations || []).join(", ")}
            onChange={(e) => setChampionForm({
              ...championForm,
              specializations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Initiatives Led"
              type="number"
              value={championForm.initiativesLed || 0}
              onChange={(e) => setChampionForm({ ...championForm, initiativesLed: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Mentee Count"
              type="number"
              value={championForm.menteeCount || 0}
              onChange={(e) => setChampionForm({ ...championForm, menteeCount: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowChampionModal(false); resetChampionForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveChampion}>Add Champion</Button>
          </div>
        </div>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          resetEventForm();
        }}
        title="Add AI Culture Event"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g., Q1 AI Hackathon"
            value={eventForm.title || ""}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Event Type"
              options={eventTypeOptions}
              value={eventForm.type || ""}
              onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as AIEvent["type"] })}
            />
            <Input
              label="Date"
              type="date"
              value={eventForm.date || ""}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
            />
          </div>
          <Input
            label="Number of Attendees"
            type="number"
            value={eventForm.attendees || ""}
            onChange={(e) => setEventForm({ ...eventForm, attendees: parseInt(e.target.value) || 0 })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe the event..."
              value={eventForm.description || ""}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowEventModal(false); resetEventForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent}>Add Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
