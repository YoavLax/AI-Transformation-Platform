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
  Modal,
  Input,
  Textarea,
  Select,
} from "@/components/ui";
import { RiskHeatmap } from "@/components/charts";
import {
  Shield,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { ModelCard, Risk } from "@/types";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { generateId, formatDate } from "@/lib/utils";

const riskCategories = ["bias", "security", "compliance", "operational", "privacy"] as const;
const severityLevels = ["low", "medium", "high", "critical"] as const;

const riskCategoryOptions = [
  { value: "bias", label: "Bias" },
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "operational", label: "Operational" },
  { value: "privacy", label: "Privacy" },
];

const severityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function GovernancePage() {
  const [modelCards, setModelCards] = useState<ModelCard[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelCard | null>(null);
  const [editingModel, setEditingModel] = useState<ModelCard | null>(null);

  const [formData, setFormData] = useState({
    model_name: "",
    version: "1.0.0",
    purpose: "",
    owner: "",
    training_data: "",
  });

  const [riskForm, setRiskForm] = useState<Risk>({
    category: "bias",
    description: "",
    severity: "medium",
    mitigation: "",
  });

  useEffect(() => {
    const stored = getFromStorage<ModelCard[]>(STORAGE_KEYS.MODEL_CARDS, []);
    setModelCards(stored);
  }, []);

  const handleCreateModel = () => {
    const modelCard: ModelCard = {
      id: editingModel?.id || generateId(),
      model_name: formData.model_name,
      version: formData.version,
      purpose: formData.purpose,
      owner: formData.owner,
      training_data: formData.training_data,
      evaluation_metrics: editingModel?.evaluation_metrics || [],
      risks: editingModel?.risks || [],
      mitigations: editingModel?.mitigations || [],
      created_at: editingModel?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updated: ModelCard[];
    if (editingModel) {
      updated = modelCards.map((mc) => (mc.id === editingModel.id ? modelCard : mc));
    } else {
      updated = [modelCard, ...modelCards];
    }

    setModelCards(updated);
    setToStorage(STORAGE_KEYS.MODEL_CARDS, updated);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      model_name: "",
      version: "1.0.0",
      purpose: "",
      owner: "",
      training_data: "",
    });
    setEditingModel(null);
  };

  const handleEdit = (model: ModelCard) => {
    setEditingModel(model);
    setFormData({
      model_name: model.model_name,
      version: model.version,
      purpose: model.purpose,
      owner: model.owner,
      training_data: model.training_data,
    });
    setShowModal(true);
  };

  const handleAddRisk = () => {
    if (!selectedModel) return;

    const updatedModel = {
      ...selectedModel,
      risks: [...selectedModel.risks, riskForm],
      updated_at: new Date().toISOString(),
    };

    const updated = modelCards.map((mc) =>
      mc.id === selectedModel.id ? updatedModel : mc
    );

    setModelCards(updated);
    setToStorage(STORAGE_KEYS.MODEL_CARDS, updated);
    setSelectedModel(updatedModel);
    setShowRiskModal(false);
    setRiskForm({
      category: "bias",
      description: "",
      severity: "medium",
      mitigation: "",
    });
  };

  const handleDelete = (id: string) => {
    const updated = modelCards.filter((mc) => mc.id !== id);
    setModelCards(updated);
    setToStorage(STORAGE_KEYS.MODEL_CARDS, updated);
  };

  const getSeverityBadge = (severity: Risk["severity"]) => {
    const variants: Record<Risk["severity"], "success" | "warning" | "danger" | "info"> = {
      low: "success",
      medium: "warning",
      high: "danger",
      critical: "danger",
    };
    return <Badge variant={variants[severity]}>{severity}</Badge>;
  };

  // Generate heatmap data
  const heatmapData = riskCategories.flatMap((category) =>
    severityLevels.map((severity) => ({
      x: category,
      y: severity,
      value: modelCards.reduce(
        (count, mc) =>
          count +
          mc.risks.filter((r) => r.category === category && r.severity === severity).length,
        0
      ) * 20, // Scale for visualization
    }))
  );

  const stats = {
    totalModels: modelCards.length,
    totalRisks: modelCards.reduce((sum, mc) => sum + mc.risks.length, 0),
    highRisks: modelCards.reduce(
      (sum, mc) =>
        sum + mc.risks.filter((r) => r.severity === "high" || r.severity === "critical").length,
      0
    ),
    mitigatedRisks: modelCards.reduce(
      (sum, mc) => sum + mc.risks.filter((r) => r.mitigation).length,
      0
    ),
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "models", label: "Model Cards" },
    { id: "risks", label: "Risk Assessment" },
  ];

  return (
    <div>
      <PageHeader
        title="Governance & Risk"
        description="Operationalize Responsible AI across your organization"
        icon={Shield}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Model Card
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Models Documented" value={stats.totalModels} icon={FileText} />
        <StatCard title="Total Risks" value={stats.totalRisks} icon={AlertTriangle} />
        <StatCard title="High/Critical Risks" value={stats.highRisks} icon={XCircle} />
        <StatCard title="Mitigated Risks" value={stats.mitigatedRisks} icon={CheckCircle2} />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Risk Overview</CardTitle>
              <CardDescription>Distribution of risks by category and severity</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskHeatmap
                data={heatmapData}
                xLabels={riskCategories.map((c) => c.charAt(0).toUpperCase() + c.slice(1))}
                yLabels={severityLevels.map((s) => s.charAt(0).toUpperCase() + s.slice(1))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Model Cards</CardTitle>
              <CardDescription>Latest documented AI models</CardDescription>
            </CardHeader>
            <CardContent>
              {modelCards.length === 0 ? (
                <EmptyState
                  title="No model cards yet"
                  description="Document your first AI model"
                />
              ) : (
                <div className="space-y-4">
                  {modelCards.slice(0, 5).map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{model.model_name}</h4>
                        <p className="text-sm text-gray-500">v{model.version} • {model.owner}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={model.risks.length > 0 ? "warning" : "success"}>
                          {model.risks.length} risks
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedModel(model)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "models" && (
        <>
          {modelCards.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<FileText className="w-8 h-8 text-gray-400" />}
                  title="No model cards yet"
                  description="Create model cards to document your AI models and their characteristics."
                  action={
                    <Button onClick={() => setShowModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Model Card
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modelCards.map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{model.model_name}</h3>
                        <p className="text-sm text-gray-500">Version {model.version}</p>
                      </div>
                      <Badge variant={model.risks.some((r) => r.severity === "high" || r.severity === "critical") ? "danger" : "success"}>
                        {model.risks.length} risks
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.purpose}</p>
                    <div className="text-sm text-gray-500 mb-4">
                      <p><strong>Owner:</strong> {model.owner}</p>
                      <p><strong>Updated:</strong> {formatDate(model.updated_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedModel(model)}
                      >
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(model)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(model.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "risks" && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
            <CardDescription>All identified risks across models</CardDescription>
          </CardHeader>
          <CardContent>
            {modelCards.flatMap((mc) => mc.risks).length === 0 ? (
              <EmptyState
                title="No risks documented"
                description="Add risks to your model cards to track them here"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Model</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelCards.flatMap((mc) =>
                      mc.risks.map((risk, idx) => (
                        <tr key={`${mc.id}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{mc.model_name}</td>
                          <td className="py-3 px-4 text-sm capitalize">{risk.category}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{risk.description}</td>
                          <td className="py-3 px-4">{getSeverityBadge(risk.severity)}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                            {risk.mitigation || "Not defined"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Model Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingModel ? "Edit Model Card" : "Create Model Card"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model Name"
              placeholder="e.g., Customer Churn Predictor"
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            />
            <Input
              label="Version"
              placeholder="1.0.0"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            />
          </div>
          <Input
            label="Owner"
            placeholder="Team or individual responsible"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          />
          <Textarea
            label="Purpose"
            placeholder="What is this model used for?"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
          <Textarea
            label="Training Data Description"
            placeholder="Describe the data used to train this model"
            value={formData.training_data}
            onChange={(e) => setFormData({ ...formData, training_data: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateModel}>
              {editingModel ? "Update" : "Create"} Model Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Model Detail Modal */}
      <Modal
        isOpen={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        title={selectedModel?.model_name || "Model Details"}
        size="xl"
      >
        {selectedModel && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Version</p>
                <p className="font-medium">{selectedModel.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium">{selectedModel.owner}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purpose</p>
              <p className="text-gray-700">{selectedModel.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Training Data</p>
              <p className="text-gray-700">{selectedModel.training_data}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Identified Risks</h4>
                <Button size="sm" onClick={() => setShowRiskModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Risk
                </Button>
              </div>
              {selectedModel.risks.length === 0 ? (
                <p className="text-sm text-gray-500">No risks documented</p>
              ) : (
                <div className="space-y-3">
                  {selectedModel.risks.map((risk, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="default" className="capitalize">{risk.category}</Badge>
                        {getSeverityBadge(risk.severity)}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                      {risk.mitigation && (
                        <p className="text-sm text-gray-500">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Risk Modal */}
      <Modal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        title="Add Risk"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Risk Category"
            options={riskCategoryOptions}
            value={riskForm.category}
            onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value as Risk["category"] })}
          />
          <Textarea
            label="Description"
            placeholder="Describe the risk"
            value={riskForm.description}
            onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
          />
          <Select
            label="Severity"
            options={severityOptions}
            value={riskForm.severity}
            onChange={(e) => setRiskForm({ ...riskForm, severity: e.target.value as Risk["severity"] })}
          />
          <Textarea
            label="Mitigation Strategy"
            placeholder="How will this risk be mitigated?"
            value={riskForm.mitigation}
            onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRiskModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRisk}>Add Risk</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
