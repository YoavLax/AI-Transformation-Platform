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
  Tabs,
} from "@/components/ui";
import { RiskHeatmap } from "@/components/charts";
import {
  Rocket,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  PauseCircle,
} from "lucide-react";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { AIInitiative, Risk } from "@/types";

const STATUSES = [
  { value: "planning", label: "Planning", icon: Calendar, color: "bg-gray-100 text-gray-700" },
  { value: "pilot", label: "Pilot", icon: Clock, color: "bg-blue-100 text-blue-700" },
  { value: "rollout", label: "Rollout", icon: Rocket, color: "bg-purple-100 text-purple-700" },
  { value: "active", label: "Active", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  { value: "on-hold", label: "On Hold", icon: PauseCircle, color: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
];

const RISK_CATEGORIES = [
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "data-privacy", label: "Data Privacy" },
  { value: "vendor-lock-in", label: "Vendor Lock-in" },
  { value: "cost", label: "Cost" },
  { value: "adoption", label: "Adoption" },
];

const RISK_SEVERITIES = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
];

const sampleInitiatives: AIInitiative[] = [];

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<AIInitiative[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<AIInitiative | null>(null);
  const [activeTab, setActiveTab] = useState("initiatives");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const stored = getFromStorage<AIInitiative[]>(STORAGE_KEYS.AI_INITIATIVES, []);
    setInitiatives(stored);
  }, []);

  const saveInitiative = (data: Partial<AIInitiative>) => {
    let updated: AIInitiative[];
    if (editingInitiative) {
      updated = initiatives.map((i) =>
        i.id === editingInitiative.id ? { ...i, ...data, updated_at: new Date().toISOString() } : i
      );
    } else {
      const newInitiative: AIInitiative = {
        id: generateId(),
        title: data.title || "",
        description: data.description || "",
        team: data.team || "",
        sponsor: data.sponsor || "",
        status: data.status || "planning",
        start_date: data.start_date || "",
        target_date: data.target_date || "",
        ai_assistants: data.ai_assistants || [],
        objectives: data.objectives || [],
        risks: data.risks || [],
        progress: data.progress || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updated = [...initiatives, newInitiative];
    }
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
    setIsModalOpen(false);
    setEditingInitiative(null);
  };

  const deleteInitiative = (id: string) => {
    const updated = initiatives.filter((i) => i.id !== id);
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
  };

  const filteredInitiatives = initiatives.filter((i) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  // Collect all risks for heatmap
  const allRisks = initiatives.flatMap((i) =>
    i.risks.map((r) => ({
      ...r,
      initiative: i.title,
    }))
  );

  const riskHeatmapData = RISK_CATEGORIES.flatMap((cat) =>
    RISK_SEVERITIES.map((sev) => ({
      x: sev.label,
      y: cat.label,
      value: allRisks.filter((r) => r.category === cat.value && r.severity === sev.value).length * 25,
    }))
  ).filter((d) => d.value > 0);

  const xLabels = RISK_SEVERITIES.map(s => s.label);
  const yLabels = RISK_CATEGORIES.map(c => c.label);

  const activeCount = initiatives.filter((i) => i.status === "active").length;
  const pilotCount = initiatives.filter((i) => i.status === "pilot").length;
  const highRiskCount = allRisks.filter((r) => r.severity === "high" || r.severity === "critical").length;
  const avgProgress = initiatives.length > 0
    ? Math.round(initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="AI Initiatives"
        description="Track AI projects with governance and risk management"
        icon={Rocket}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Initiative
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Initiatives" value={activeCount.toString()} icon={Rocket} />
        <StatCard title="In Pilot" value={pilotCount.toString()} icon={Clock} />
        <StatCard
          title="High/Critical Risks"
          value={highRiskCount.toString()}
          change={highRiskCount > 0 ? -1 : 1}
          changeLabel={highRiskCount > 0 ? "needs attention" : "all clear"}
          icon={AlertTriangle}
        />
        <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={CheckCircle2} />
      </div>

      <Tabs
        tabs={[
          { id: "initiatives", label: "Initiatives" },
          { id: "risks", label: "Risk Overview" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === "initiatives" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-48"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          {filteredInitiatives.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No initiatives found"
              description="Create your first AI initiative to get started"
              action={
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Initiative
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {filteredInitiatives.map((initiative) => {
                const statusConfig = STATUSES.find((s) => s.value === initiative.status);
                const StatusIcon = statusConfig?.icon || Clock;
                return (
                  <Card key={initiative.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{initiative.title}</h3>
                            <Badge className={statusConfig?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{initiative.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">Team</span>
                              <p className="font-medium">{initiative.team}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Sponsor</span>
                              <p className="font-medium">{initiative.sponsor}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Start Date</span>
                              <p className="font-medium">{formatDate(initiative.start_date)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Target Date</span>
                              <p className="font-medium">{formatDate(initiative.target_date)}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{initiative.progress}%</span>
                            </div>
                            <Progress value={initiative.progress} className="h-2" />
                          </div>

                          {/* Objectives */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Objectives</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {initiative.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Risks */}
                          {initiative.risks.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Risks ({initiative.risks.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {initiative.risks.map((risk) => {
                                  const sevConfig = RISK_SEVERITIES.find((s) => s.value === risk.severity);
                                  return (
                                    <Badge key={risk.id} className={sevConfig?.color}>
                                      {RISK_CATEGORIES.find((c) => c.value === risk.category)?.label}: {risk.severity}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex lg:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingInitiative(initiative);
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
                              if (confirm("Delete this initiative?")) {
                                deleteInitiative(initiative.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "risks" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Risk Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                {riskHeatmapData.length > 0 ? (
                  <RiskHeatmap data={riskHeatmapData} xLabels={xLabels} yLabels={yLabels} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No risks recorded yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Risks</CardTitle>
              </CardHeader>
              <CardContent>
                {allRisks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No risks recorded yet</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allRisks.map((risk, i) => {
                      const sevConfig = RISK_SEVERITIES.find((s) => s.value === risk.severity);
                      return (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={sevConfig?.color}>{risk.severity}</Badge>
                            <span className="text-xs text-gray-500">{risk.initiative}</span>
                          </div>
                          <p className="text-sm font-medium">
                            {RISK_CATEGORIES.find((c) => c.value === risk.category)?.label}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                          {risk.mitigation && (
                            <p className="text-xs text-gray-500 mt-2">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
      )}

      {/* Add/Edit Modal */}
      <InitiativeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInitiative(null);
        }}
        onSave={saveInitiative}
        initiative={editingInitiative}
      />
    </div>
  );
}

function InitiativeModal({
  isOpen,
  onClose,
  onSave,
  initiative,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AIInitiative>) => void;
  initiative: AIInitiative | null;
}) {
  const [formData, setFormData] = useState<Partial<AIInitiative>>({});

  useEffect(() => {
    if (initiative) {
      setFormData(initiative);
    } else {
      setFormData({
        title: "",
        description: "",
        team: "",
        sponsor: "",
        status: "planning",
        start_date: "",
        target_date: "",
        ai_assistants: [],
        objectives: [],
        risks: [],
        progress: 0,
      });
    }
  }, [initiative]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initiative ? "Edit Initiative" : "New Initiative"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <Textarea
          label="Description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Team"
            value={formData.team || ""}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
            required
          />
          <Input
            label="Sponsor"
            value={formData.sponsor || ""}
            onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Status"
            value={formData.status || "planning"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AIInitiative["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Input
            label="Start Date"
            type="date"
            value={formData.start_date || ""}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
          <Input
            label="Target Date"
            type="date"
            value={formData.target_date || ""}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
          />
        </div>

        <Input
          label="Progress (%)"
          type="number"
          value={formData.progress || 0}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          min={0}
          max={100}
        />

        <Textarea
          label="Objectives (one per line)"
          value={formData.objectives?.join("\n") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              objectives: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={3}
          placeholder="Achieve 80% adoption&#10;Improve productivity by 20%"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initiative ? "Update" : "Create"} Initiative</Button>
        </div>
      </form>
    </Modal>
  );
}
