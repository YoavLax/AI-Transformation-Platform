"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, StatCard, EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  Modal,
  Input,
  Textarea,
  Select,
} from "@/components/ui";
import { PrioritizationMatrix } from "@/components/charts";
import {
  Sparkles,
  Plus,
  Filter,
  Grid3X3,
  List,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { UseCase } from "@/types";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { generateId, formatDate } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const departmentOptions = [
  { value: "", label: "Select Department" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
  { value: "Operations", label: "Operations" },
  { value: "Finance", label: "Finance" },
  { value: "HR", label: "Human Resources" },
  { value: "IT", label: "Information Technology" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "R&D", label: "Research & Development" },
];

const dataAvailabilityOptions = [
  { value: "high", label: "High - Data readily available" },
  { value: "medium", label: "Medium - Some data exists" },
  { value: "low", label: "Low - Data needs to be collected" },
];

const timelineOptions = [
  { value: "1-3 months", label: "1-3 months" },
  { value: "3-6 months", label: "3-6 months" },
  { value: "6-12 months", label: "6-12 months" },
  { value: "12+ months", label: "12+ months" },
];

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [view, setView] = useState<"grid" | "list" | "matrix">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    problem_statement: "",
    expected_outcomes: "",
    data_availability: "medium" as "high" | "medium" | "low",
    impact_score: 50,
    feasibility_score: 50,
    risk_score: 30,
    timeline_estimate: "3-6 months",
  });

  useEffect(() => {
    const stored = getFromStorage<UseCase[]>(STORAGE_KEYS.USE_CASES, []);
    setUseCases(stored);
  }, []);

  const filteredUseCases = useCases.filter((uc) => {
    const matchesStatus = statusFilter === "all" || uc.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      uc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const matrixData = filteredUseCases.map((uc) => ({
    id: uc.id,
    name: uc.title,
    x: uc.impact_score,
    y: uc.feasibility_score,
    risk: uc.risk_score,
  }));

  const handleSubmit = () => {
    const useCase: UseCase = {
      id: editingUseCase?.id || generateId(),
      ...formData,
      status: editingUseCase?.status || "draft",
      created_at: editingUseCase?.created_at || new Date().toISOString(),
    };

    let updated: UseCase[];
    if (editingUseCase) {
      updated = useCases.map((uc) => (uc.id === editingUseCase.id ? useCase : uc));
    } else {
      updated = [useCase, ...useCases];
    }

    setUseCases(updated);
    setToStorage(STORAGE_KEYS.USE_CASES, updated);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      department: "",
      problem_statement: "",
      expected_outcomes: "",
      data_availability: "medium",
      impact_score: 50,
      feasibility_score: 50,
      risk_score: 30,
      timeline_estimate: "3-6 months",
    });
    setEditingUseCase(null);
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    setFormData({
      title: useCase.title,
      description: useCase.description,
      department: useCase.department,
      problem_statement: useCase.problem_statement,
      expected_outcomes: useCase.expected_outcomes,
      data_availability: useCase.data_availability,
      impact_score: useCase.impact_score,
      feasibility_score: useCase.feasibility_score,
      risk_score: useCase.risk_score,
      timeline_estimate: useCase.timeline_estimate,
    });
    setShowModal(true);
  };

  const handleStatusChange = (id: string, newStatus: UseCase["status"]) => {
    const updated = useCases.map((uc) =>
      uc.id === id ? { ...uc, status: newStatus } : uc
    );
    setUseCases(updated);
    setToStorage(STORAGE_KEYS.USE_CASES, updated);
  };

  const handleDelete = (id: string) => {
    const updated = useCases.filter((uc) => uc.id !== id);
    setUseCases(updated);
    setToStorage(STORAGE_KEYS.USE_CASES, updated);
  };

  const getStatusBadge = (status: UseCase["status"]) => {
    const variants: Record<UseCase["status"], "default" | "info" | "warning" | "success" | "danger"> = {
      draft: "default",
      submitted: "info",
      approved: "success",
      in_progress: "warning",
      completed: "success",
    };
    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>;
  };

  const stats = {
    total: useCases.length,
    approved: useCases.filter((uc) => uc.status === "approved").length,
    inProgress: useCases.filter((uc) => uc.status === "in_progress").length,
    completed: useCases.filter((uc) => uc.status === "completed").length,
  };

  return (
    <div>
      <PageHeader
        title="Use Case Prioritization"
        description="Discover and prioritize high-value AI opportunities"
        icon={Sparkles}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Use Case
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Use Cases" value={stats.total} icon={Sparkles} />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} />
        <StatCard title="Completed" value={stats.completed} icon={TrendingUp} />
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search use cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded ${view === "grid" ? "bg-white shadow-sm" : ""}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded ${view === "list" ? "bg-white shadow-sm" : ""}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("matrix")}
            className={`p-2 rounded ${view === "matrix" ? "bg-white shadow-sm" : ""}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {useCases.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Sparkles className="w-8 h-8 text-gray-400" />}
              title="No use cases yet"
              description="Start by adding your first AI use case to prioritize and track."
              action={
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Use Case
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : view === "matrix" ? (
        <Card>
          <CardHeader>
            <CardTitle>Prioritization Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <PrioritizationMatrix
              data={matrixData}
              xLabel="Impact Score"
              yLabel="Feasibility Score"
              onPointClick={(data) => {
                const uc = useCases.find((u) => u.id === data.id);
                if (uc) handleEdit(uc);
              }}
            />
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUseCases.map((useCase) => (
            <Card key={useCase.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge(useCase.status)}
                  <Badge variant="default">{useCase.department}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {useCase.description}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Impact</p>
                    <p className="font-semibold text-gray-900">{useCase.impact_score}%</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Feasibility</p>
                    <p className="font-semibold text-gray-900">{useCase.feasibility_score}%</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Risk</p>
                    <p className="font-semibold text-gray-900">{useCase.risk_score}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(useCase)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(useCase.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Impact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Feasibility</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUseCases.map((useCase) => (
                    <tr key={useCase.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{useCase.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{useCase.description}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{useCase.department}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{useCase.impact_score}%</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{useCase.feasibility_score}%</td>
                      <td className="py-3 px-4">{getStatusBadge(useCase.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(useCase)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(useCase.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingUseCase ? "Edit Use Case" : "New Use Case"}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Customer Churn Prediction"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the use case"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              options={departmentOptions}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Select
              label="Data Availability"
              options={dataAvailabilityOptions}
              value={formData.data_availability}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data_availability: e.target.value as "high" | "medium" | "low",
                })
              }
            />
          </div>
          <Textarea
            label="Problem Statement"
            placeholder="What problem does this solve?"
            value={formData.problem_statement}
            onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
          />
          <Textarea
            label="Expected Outcomes"
            placeholder="What are the expected benefits?"
            value={formData.expected_outcomes}
            onChange={(e) => setFormData({ ...formData, expected_outcomes: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impact Score: {formData.impact_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.impact_score}
                onChange={(e) => setFormData({ ...formData, impact_score: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feasibility Score: {formData.feasibility_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.feasibility_score}
                onChange={(e) => setFormData({ ...formData, feasibility_score: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Score: {formData.risk_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.risk_score}
                onChange={(e) => setFormData({ ...formData, risk_score: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <Select
            label="Timeline Estimate"
            options={timelineOptions.map((t) => ({ value: t.value, label: t.label }))}
            value={formData.timeline_estimate}
            onChange={(e) => setFormData({ ...formData, timeline_estimate: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingUseCase ? "Update" : "Create"} Use Case
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
