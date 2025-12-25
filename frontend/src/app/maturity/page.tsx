"use client";

import { useState, useEffect } from "react";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  Progress,
} from "@/components/ui";
import { MaturityRadarChart } from "@/components/charts";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  Target,
  BarChart,
} from "lucide-react";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { TeamMaturity, MaturityScores } from "@/types";

const MATURITY_LEVELS = [
  { value: "novice", label: "Novice", color: "bg-red-100 text-red-700", score: 1 },
  { value: "developing", label: "Developing", color: "bg-orange-100 text-orange-700", score: 2 },
  { value: "proficient", label: "Proficient", color: "bg-yellow-100 text-yellow-700", score: 3 },
  { value: "advanced", label: "Advanced", color: "bg-green-100 text-green-700", score: 4 },
  { value: "leading", label: "Leading", color: "bg-blue-100 text-blue-700", score: 5 },
];

const DIMENSIONS = [
  { key: "adoption", label: "Adoption", description: "How many team members actively use AI tools" },
  { key: "proficiency", label: "Proficiency", description: "How effectively they use AI tools" },
  { key: "integration", label: "Integration", description: "How well AI is integrated into workflows" },
  { key: "governance", label: "Governance", description: "Following best practices and policies" },
  { key: "innovation", label: "Innovation", description: "Experimenting with new AI capabilities" },
];

const sampleTeamMaturity: TeamMaturity[] = [];

function calculateOverallLevel(scores: MaturityScores): TeamMaturity["overall_level"] {
  const avg = (scores.adoption + scores.proficiency + scores.integration + scores.governance + scores.innovation) / 5;
  if (avg >= 80) return "leading";
  if (avg >= 65) return "advanced";
  if (avg >= 50) return "proficient";
  if (avg >= 35) return "developing";
  return "novice";
}

export default function MaturityPage() {
  const [teams, setTeams] = useState<TeamMaturity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamMaturity | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamMaturity | null>(null);

  useEffect(() => {
    const stored = getFromStorage<TeamMaturity[]>(STORAGE_KEYS.TEAM_MATURITY, []);
    setTeams(stored);
  }, []);

  const saveTeam = (data: Partial<TeamMaturity>) => {
    let updated: TeamMaturity[];
    const scores = data.scores || { adoption: 0, proficiency: 0, integration: 0, governance: 0, innovation: 0 };
    const overall_level = calculateOverallLevel(scores);

    if (editingTeam) {
      updated = teams.map((t) =>
        t.id === editingTeam.id ? { ...t, ...data, overall_level } : t
      );
    } else {
      const newTeam: TeamMaturity = {
        id: generateId(),
        team: data.team || "",
        department: data.department || "Engineering",
        assessment_date: new Date().toISOString().split("T")[0],
        scores,
        overall_level,
        strengths: data.strengths || [],
        improvement_areas: data.improvement_areas || [],
        recommendations: data.recommendations || [],
        assessor: data.assessor || "AI Enablement Team",
      };
      updated = [...teams, newTeam];
    }
    setTeams(updated);
    setToStorage(STORAGE_KEYS.TEAM_MATURITY, updated);
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const deleteTeam = (id: string) => {
    const updated = teams.filter((t) => t.id !== id);
    setTeams(updated);
    setToStorage(STORAGE_KEYS.TEAM_MATURITY, updated);
    if (selectedTeam?.id === id) {
      setSelectedTeam(null);
    }
  };

  // Calculate org-wide averages
  const orgAvgScores = teams.length > 0
    ? {
        adoption: Math.round(teams.reduce((sum, t) => sum + t.scores.adoption, 0) / teams.length),
        proficiency: Math.round(teams.reduce((sum, t) => sum + t.scores.proficiency, 0) / teams.length),
        integration: Math.round(teams.reduce((sum, t) => sum + t.scores.integration, 0) / teams.length),
        governance: Math.round(teams.reduce((sum, t) => sum + t.scores.governance, 0) / teams.length),
        innovation: Math.round(teams.reduce((sum, t) => sum + t.scores.innovation, 0) / teams.length),
      }
    : { adoption: 0, proficiency: 0, integration: 0, governance: 0, innovation: 0 };

  const orgOverallLevel = calculateOverallLevel(orgAvgScores);
  const advancedTeams = teams.filter((t) => t.overall_level === "advanced" || t.overall_level === "leading").length;
  const avgOverallScore = teams.length > 0
    ? Math.round(
        teams.reduce(
          (sum, t) =>
            sum + (t.scores.adoption + t.scores.proficiency + t.scores.integration + t.scores.governance + t.scores.innovation) / 5,
          0
        ) / teams.length
      )
    : 0;

  const radarData = selectedTeam
    ? DIMENSIONS.map((d) => ({
        subject: d.label,
        value: selectedTeam.scores[d.key as keyof MaturityScores],
        fullMark: 100,
      }))
    : DIMENSIONS.map((d) => ({
        subject: d.label,
        value: orgAvgScores[d.key as keyof MaturityScores],
        fullMark: 100,
      }));

  return (
    <div>
      <PageHeader
        title="Team AI Maturity"
        description="Assess and track AI maturity levels across engineering teams"
        icon={Users}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Teams Assessed"
          value={teams.length.toString()}
          icon={Users}
        />
        <StatCard
          title="Org Maturity Level"
          value={MATURITY_LEVELS.find((l) => l.value === orgOverallLevel)?.label || "N/A"}
          icon={Award}
        />
        <StatCard
          title="Avg Maturity Score"
          value={`${avgOverallScore}%`}
          change={5}
          changeLabel="vs last quarter"
          icon={Target}
        />
        <StatCard
          title="Advanced+ Teams"
          value={`${advancedTeams}/${teams.length}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No teams assessed yet</p>
              ) : (
                <div className="space-y-2">
                  <button
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      !selectedTeam ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTeam(null)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Organization Average</span>
                      <Badge className={MATURITY_LEVELS.find((l) => l.value === orgOverallLevel)?.color}>
                        {MATURITY_LEVELS.find((l) => l.value === orgOverallLevel)?.label}
                      </Badge>
                    </div>
                  </button>
                  {teams.map((team) => {
                    const levelConfig = MATURITY_LEVELS.find((l) => l.value === team.overall_level);
                    return (
                      <button
                        key={team.id}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedTeam?.id === team.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedTeam(team)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{team.team}</span>
                          <Badge className={levelConfig?.color}>{levelConfig?.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Assessed: {formatDate(team.assessment_date)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maturity Radar */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {selectedTeam ? `${selectedTeam.team} Maturity` : "Organization Maturity Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MaturityRadarChart data={radarData} />
            </CardContent>
          </Card>

          {/* Dimension Scores */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dimension Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DIMENSIONS.map((dim) => {
                  const score = selectedTeam
                    ? selectedTeam.scores[dim.key as keyof MaturityScores]
                    : orgAvgScores[dim.key as keyof MaturityScores];
                  return (
                    <div key={dim.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{dim.label}</span>
                        <span className="text-sm text-gray-600">{score}%</span>
                      </div>
                      <Progress
                        value={score}
                        className={`h-2 ${
                          score >= 70 ? "[&>div]:bg-green-500" : score >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">{dim.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Team Details */}
          {selectedTeam && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assessment Details</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTeam(selectedTeam);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Delete this assessment?")) {
                          deleteTeam(selectedTeam.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {selectedTeam.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-700 mb-2">Improvement Areas</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {selectedTeam.improvement_areas.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500">!</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Recommendations</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {selectedTeam.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <MaturityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeam(null);
        }}
        onSave={saveTeam}
        team={editingTeam}
      />
    </div>
  );
}

function MaturityModal({
  isOpen,
  onClose,
  onSave,
  team,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TeamMaturity>) => void;
  team: TeamMaturity | null;
}) {
  const [formData, setFormData] = useState<Partial<TeamMaturity>>({});

  useEffect(() => {
    if (team) {
      setFormData(team);
    } else {
      setFormData({
        team: "",
        department: "Engineering",
        scores: { adoption: 50, proficiency: 50, integration: 50, governance: 50, innovation: 50 },
        strengths: [],
        improvement_areas: [],
        recommendations: [],
        assessor: "AI Enablement Team",
      });
    }
  }, [team]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateScore = (key: keyof MaturityScores, value: number) => {
    setFormData({
      ...formData,
      scores: {
        ...formData.scores!,
        [key]: value,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? "Edit Assessment" : "New Team Assessment"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Team Name"
            value={formData.team || ""}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
            required
          />
          <Input
            label="Department"
            value={formData.department || ""}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Maturity Scores (0-100)</label>
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="flex items-center gap-4">
              <span className="text-sm w-24">{dim.label}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.scores?.[dim.key as keyof MaturityScores] || 50}
                onChange={(e) => updateScore(dim.key as keyof MaturityScores, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">
                {formData.scores?.[dim.key as keyof MaturityScores] || 50}%
              </span>
            </div>
          ))}
        </div>

        <Textarea
          label="Strengths (one per line)"
          value={formData.strengths?.join("\n") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              strengths: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={2}
        />

        <Textarea
          label="Improvement Areas (one per line)"
          value={formData.improvement_areas?.join("\n") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              improvement_areas: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={2}
        />

        <Textarea
          label="Recommendations (one per line)"
          value={formData.recommendations?.join("\n") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              recommendations: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={3}
        />

        <Input
          label="Assessor"
          value={formData.assessor || ""}
          onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{team ? "Update" : "Create"} Assessment</Button>
        </div>
      </form>
    </Modal>
  );
}
