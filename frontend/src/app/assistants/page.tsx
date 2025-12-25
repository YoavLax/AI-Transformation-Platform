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
} from "@/components/ui";
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import type { AIAssistant } from "@/types";

const CATEGORIES = [
  { value: "code-assistant", label: "Code Assistant" },
  { value: "chat", label: "Chat / Conversational AI" },
  { value: "documentation", label: "Documentation" },
  { value: "testing", label: "Testing" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

const sampleAssistants: AIAssistant[] = [];

export default function AIAssistantsPage() {
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<AIAssistant | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Fetch GitHub Copilot data and sync with assistants
  const syncGitHubCopilot = async () => {
    setCopilotLoading(true);
    try {
      const response = await fetch('/api/copilot');
      if (!response.ok) throw new Error('Failed to fetch Copilot data');
      
      const data = await response.json();
      const totalLicenses = data.summary?.totalLicenses || 0;
      const activeUsers = data.summary?.totalActiveUsers || 0;
      
      // Find or create GitHub Copilot assistant
      const stored = getFromStorage<AIAssistant[]>(STORAGE_KEYS.AI_ASSISTANTS, []);
      const copilotIndex = stored.findIndex(a => 
        a.name.toLowerCase().includes('copilot') && 
        a.vendor.toLowerCase().includes('github')
      );
      
      const copilotAssistant: AIAssistant = {
        id: copilotIndex >= 0 ? stored[copilotIndex].id : generateId(),
        name: "GitHub Copilot Business",
        vendor: "GitHub / Microsoft",
        description: "AI pair programmer that helps write code faster with autocomplete and chat",
        category: "code-assistant",
        monthly_price: 19, // $19/user/month for Business
        licenses: totalLicenses,
        active_users: activeUsers,
        contract_start: copilotIndex >= 0 ? stored[copilotIndex].contract_start : "2024-01-01",
        contract_end: copilotIndex >= 0 ? stored[copilotIndex].contract_end : "2026-12-31",
        status: "active",
        features: ["Code completion", "Chat", "Code review", "CLI"],
        created_at: copilotIndex >= 0 ? stored[copilotIndex].created_at : new Date().toISOString(),
      };
      
      let updated: AIAssistant[];
      if (copilotIndex >= 0) {
        updated = stored.map((a, i) => i === copilotIndex ? copilotAssistant : a);
      } else {
        updated = [...stored, copilotAssistant];
      }
      
      setAssistants(updated);
      setToStorage(STORAGE_KEYS.AI_ASSISTANTS, updated);
    } catch (error) {
      console.error('Error syncing GitHub Copilot:', error);
    } finally {
      setCopilotLoading(false);
    }
  };

  useEffect(() => {
    const stored = getFromStorage<AIAssistant[]>(STORAGE_KEYS.AI_ASSISTANTS, []);
    setAssistants(stored);
    
    // Auto-sync GitHub Copilot data on page load
    syncGitHubCopilot();
  }, []);

  const saveAssistant = (data: Partial<AIAssistant>) => {
    let updated: AIAssistant[];
    if (editingAssistant) {
      updated = assistants.map((a) =>
        a.id === editingAssistant.id ? { ...a, ...data } : a
      );
    } else {
      const newAssistant: AIAssistant = {
        id: generateId(),
        name: data.name || "",
        vendor: data.vendor || "",
        description: data.description || "",
        category: data.category || "other",
        monthly_price: data.monthly_price || 0,
        licenses: data.licenses || 0,
        active_users: data.active_users || 0,
        contract_start: data.contract_start || "",
        contract_end: data.contract_end || "",
        status: data.status || "pending",
        features: data.features || [],
        created_at: new Date().toISOString(),
      };
      updated = [...assistants, newAssistant];
    }
    setAssistants(updated);
    setToStorage(STORAGE_KEYS.AI_ASSISTANTS, updated);
    setIsModalOpen(false);
    setEditingAssistant(null);
  };

  const deleteAssistant = (id: string) => {
    const updated = assistants.filter((a) => a.id !== id);
    setAssistants(updated);
    setToStorage(STORAGE_KEYS.AI_ASSISTANTS, updated);
  };

  const filteredAssistants = assistants.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  const totalMonthlyCost = assistants
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.monthly_price * a.licenses, 0);

  const totalLicenses = assistants
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.licenses, 0);

  const totalActiveUsers = assistants
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.active_users, 0);

  const utilizationRate = totalLicenses > 0 ? (totalActiveUsers / totalLicenses) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="AI Assistants Cost"
        description="Manage AI tools, vendors, licenses, and costs"
        icon={Bot}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncGitHubCopilot} disabled={copilotLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${copilotLoading ? 'animate-spin' : ''}`} />
              Sync Copilot
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add AI Assistant
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Monthly AI Spend"
          value={formatCurrency(totalMonthlyCost)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Licenses"
          value={totalLicenses.toString()}
          icon={Users}
        />
        <StatCard
          title="Active Users"
          value={totalActiveUsers.toString()}
          icon={Users}
        />
        <StatCard
          title="Utilization Rate"
          value={`${utilizationRate.toFixed(0)}%`}
          change={utilizationRate >= 80 ? 1 : -1}
          changeLabel={utilizationRate >= 80 ? "healthy" : "room to optimize"}
          icon={Bot}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-48"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Assistants Grid */}
      {filteredAssistants.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No AI assistants found"
          description="Add your first AI assistant to start tracking"
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add AI Assistant
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.map((assistant) => (
            <Card key={assistant.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assistant.name}</CardTitle>
                    <p className="text-sm text-gray-500">{assistant.vendor}</p>
                  </div>
                  <Badge
                    variant={
                      assistant.status === "active"
                        ? "success"
                        : assistant.status === "trial"
                        ? "warning"
                        : assistant.status === "cancelled"
                        ? "danger"
                        : "default"
                    }
                  >
                    {assistant.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{assistant.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">
                      {CATEGORIES.find((c) => c.value === assistant.category)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price per license</span>
                    <span className="font-medium">{formatCurrency(assistant.monthly_price)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Licenses</span>
                    <span className="font-medium">{assistant.licenses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Users</span>
                    <span className="font-medium">
                      {assistant.active_users} ({((assistant.active_users / assistant.licenses) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Cost</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(assistant.monthly_price * assistant.licenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contract End</span>
                    <span className="font-medium">{formatDate(assistant.contract_end)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-4">
                  {assistant.features.slice(0, 3).map((feature, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {assistant.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{assistant.features.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingAssistant(assistant);
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
                      if (confirm("Delete this AI assistant?")) {
                        deleteAssistant(assistant.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AssistantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAssistant(null);
        }}
        onSave={saveAssistant}
        assistant={editingAssistant}
      />
    </div>
  );
}

function AssistantModal({
  isOpen,
  onClose,
  onSave,
  assistant,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AIAssistant>) => void;
  assistant: AIAssistant | null;
}) {
  const [formData, setFormData] = useState<Partial<AIAssistant>>({});

  useEffect(() => {
    if (assistant) {
      setFormData(assistant);
    } else {
      setFormData({
        name: "",
        vendor: "",
        description: "",
        category: "code-assistant",
        monthly_price: 0,
        licenses: 0,
        active_users: 0,
        contract_start: "",
        contract_end: "",
        status: "pending",
        features: [],
      });
    }
  }, [assistant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assistant ? "Edit AI Assistant" : "Add AI Assistant"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Vendor"
            value={formData.vendor || ""}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            required
          />
        </div>

        <Textarea
          label="Description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category || "code-assistant"}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as AIAssistant["category"] })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={formData.status || "pending"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AIAssistant["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Monthly Price ($)"
            type="number"
            value={formData.monthly_price || 0}
            onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
            min={0}
            step={0.01}
          />
          <Input
            label="Licenses"
            type="number"
            value={formData.licenses || 0}
            onChange={(e) => setFormData({ ...formData, licenses: parseInt(e.target.value) })}
            min={0}
          />
          <Input
            label="Active Users"
            type="number"
            value={formData.active_users || 0}
            onChange={(e) => setFormData({ ...formData, active_users: parseInt(e.target.value) })}
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contract Start"
            type="date"
            value={formData.contract_start || ""}
            onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
          />
          <Input
            label="Contract End"
            type="date"
            value={formData.contract_end || ""}
            onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
          />
        </div>

        <Input
          label="Features (comma-separated)"
          value={formData.features?.join(", ") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean),
            })
          }
          placeholder="Code completion, Chat, Documentation"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{assistant ? "Update" : "Add"} Assistant</Button>
        </div>
      </form>
    </Modal>
  );
}
