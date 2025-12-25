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
  Circle,
  CheckSquare,
  Square,
} from "lucide-react";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { AIInitiative, Risk, ActionItem } from "@/types";

const STATUSES = [
  { value: "todo", label: "To Do", icon: Circle, color: "bg-gray-100 text-gray-700" },
  { value: "in-progress", label: "In Progress", icon: Clock, color: "bg-blue-100 text-blue-700" },
  { value: "done", label: "Done", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
];

const sampleInitiatives: AIInitiative[] = [];

// Helper function to calculate progress from action items
const calculateProgress = (actionItems: ActionItem[]): number => {
  if (actionItems.length === 0) return 0;
  const completed = actionItems.filter(item => item.completed).length;
  return Math.round((completed / actionItems.length) * 100);
};

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<AIInitiative[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<AIInitiative | null>(null);
  const [isActionItemModalOpen, setIsActionItemModalOpen] = useState(false);
  const [currentInitiative, setCurrentInitiative] = useState<AIInitiative | null>(null);
  const [draggedInitiative, setDraggedInitiative] = useState<AIInitiative | null>(null);

  useEffect(() => {
    const stored = getFromStorage<AIInitiative[]>(STORAGE_KEYS.AI_INITIATIVES, []);
    setInitiatives(stored);
  }, []);

  const saveInitiative = (data: Partial<AIInitiative>) => {
    let updated: AIInitiative[];
    if (editingInitiative) {
      updated = initiatives.map((i) => {
        if (i.id === editingInitiative.id) {
          const updatedData = { ...i, ...data, updated_at: new Date().toISOString() };
          // Recalculate progress if action items changed
          if (data.action_items) {
            updatedData.progress = calculateProgress(data.action_items);
          }
          return updatedData;
        }
        return i;
      });
    } else {
      const actionItems = data.action_items || [];
      const newInitiative: AIInitiative = {
        id: generateId(),
        title: data.title || "",
        description: data.description || "",
        team: data.team || "",
        sponsor: data.sponsor || "",
        status: data.status || "todo",
        start_date: data.start_date || "",
        target_date: data.target_date || "",
        ai_assistants: data.ai_assistants || [],
        objectives: data.objectives || [],
        action_items: actionItems,
        risks: data.risks || [],
        progress: calculateProgress(actionItems),
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

  const updateInitiativeStatus = (id: string, newStatus: AIInitiative["status"]) => {
    const updated = initiatives.map((i) =>
      i.id === id ? { ...i, status: newStatus, updated_at: new Date().toISOString() } : i
    );
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
  };

  const handleDragStart = (initiative: AIInitiative) => {
    setDraggedInitiative(initiative);
  };

  const handleDragEnd = () => {
    setDraggedInitiative(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: AIInitiative["status"]) => {
    if (draggedInitiative && draggedInitiative.status !== newStatus) {
      updateInitiativeStatus(draggedInitiative.id, newStatus);
    }
    setDraggedInitiative(null);
  };

  const toggleActionItem = (initiativeId: string, actionItemId: string) => {
    const updated = initiatives.map((i) => {
      if (i.id === initiativeId) {
        const updatedActionItems = i.action_items.map((item) =>
          item.id === actionItemId ? { ...item, completed: !item.completed } : item
        );
        const progress = calculateProgress(updatedActionItems);
        return { ...i, action_items: updatedActionItems, progress, updated_at: new Date().toISOString() };
      }
      return i;
    });
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
  };

  const addActionItem = (initiativeId: string, title: string, assignee?: string, due_date?: string) => {
    const updated = initiatives.map((i) => {
      if (i.id === initiativeId) {
        const newActionItem: ActionItem = {
          id: generateId(),
          title,
          completed: false,
          assignee,
          due_date,
          created_at: new Date().toISOString(),
        };
        const updatedActionItems = [...i.action_items, newActionItem];
        const progress = calculateProgress(updatedActionItems);
        return {
          ...i,
          action_items: updatedActionItems,
          progress,
          updated_at: new Date().toISOString(),
        };
      }
      return i;
    });
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
  };

  const deleteActionItem = (initiativeId: string, actionItemId: string) => {
    const updated = initiatives.map((i) => {
      if (i.id === initiativeId) {
        const updatedActionItems = i.action_items.filter((item) => item.id !== actionItemId);
        const progress = calculateProgress(updatedActionItems);
        return {
          ...i,
          action_items: updatedActionItems,
          progress,
          updated_at: new Date().toISOString(),
        };
      }
      return i;
    });
    setInitiatives(updated);
    setToStorage(STORAGE_KEYS.AI_INITIATIVES, updated);
  };

  const todoCount = initiatives.filter((i) => i.status === "todo").length;
  const inProgressCount = initiatives.filter((i) => i.status === "in-progress").length;
  const doneCount = initiatives.filter((i) => i.status === "done").length;
  const totalInitiatives = initiatives.length;

  const initiativesByStatus = {
    todo: initiatives.filter((i) => i.status === "todo"),
    "in-progress": initiatives.filter((i) => i.status === "in-progress"),
    done: initiatives.filter((i) => i.status === "done"),
  };

  return (
    <div>
      <PageHeader
        title="AI Initiatives"
        description="Track AI projects with swimlane board and action items"
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
        <StatCard title="To Do" value={todoCount.toString()} icon={Circle} />
        <StatCard title="In Progress" value={inProgressCount.toString()} icon={Clock} />
        <StatCard title="Done" value={doneCount.toString()} icon={CheckCircle2} />
        <StatCard title="Total Action Items" value={totalInitiatives.toString()} icon={Rocket} />
      </div>

      {initiatives.length === 0 ? (
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {STATUSES.map((status) => {
                const statusInitiatives = initiativesByStatus[status.value as keyof typeof initiativesByStatus];
                const StatusIcon = status.icon;
                const isDraggedOver = draggedInitiative?.status !== status.value;
                
                return (
                  <div 
                    key={status.value} 
                    className="flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(status.value as AIInitiative["status"])}
                  >
                    <div className={`p-4 rounded-t-lg border-b-2 ${status.color} font-semibold flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-5 h-5" />
                        {status.label}
                      </div>
                      <Badge className="bg-white text-gray-700">{statusInitiatives.length}</Badge>
                    </div>
                    <div 
                      className={`flex-1 bg-gray-50 p-4 rounded-b-lg space-y-4 min-h-[400px] transition-colors ${
                        draggedInitiative && isDraggedOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                      }`}
                    >
                      {statusInitiatives.map((initiative) => (
                        <InitiativeCard
                          key={initiative.id}
                          initiative={initiative}
                          onEdit={(init) => {
                            setEditingInitiative(init);
                            setIsModalOpen(true);
                          }}
                          onDelete={deleteInitiative}
                          onToggleActionItem={toggleActionItem}
                          onAddActionItem={(init) => {
                            setCurrentInitiative(init);
                            setIsActionItemModalOpen(true);
                          }}
                          onDeleteActionItem={deleteActionItem}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedInitiative?.id === initiative.id}
                        />
                      ))}
                      {statusInitiatives.length === 0 && draggedInitiative && isDraggedOver && (
                        <div className="text-center text-gray-400 py-8">
                          Drop here to move to {status.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* Add/Edit Initiative Modal */}
      <InitiativeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInitiative(null);
        }}
        onSave={saveInitiative}
        initiative={editingInitiative}
      />

      {/* Add Action Item Modal */}
      <ActionItemModal
        isOpen={isActionItemModalOpen}
        onClose={() => {
          setIsActionItemModalOpen(false);
          setCurrentInitiative(null);
        }}
        onSave={(title, assignee, due_date) => {
          if (currentInitiative) {
            addActionItem(currentInitiative.id, title, assignee, due_date);
          }
          setIsActionItemModalOpen(false);
          setCurrentInitiative(null);
        }}
      />
    </div>
  );
}

function InitiativeCard({
  initiative,
  onEdit,
  onDelete,
  onToggleActionItem,
  onAddActionItem,
  onDeleteActionItem,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  initiative: AIInitiative;
  onEdit: (initiative: AIInitiative) => void;
  onDelete: (id: string) => void;
  onToggleActionItem: (initiativeId: string, actionItemId: string) => void;
  onAddActionItem: (initiative: AIInitiative) => void;
  onDeleteActionItem: (initiativeId: string, actionItemId: string) => void;
  onDragStart: (initiative: AIInitiative) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const completedActions = initiative.action_items.filter((item) => item.completed).length;
  const totalActions = initiative.action_items.length;

  return (
    <Card 
      className={`hover:shadow-md transition-all cursor-move group ${isDragging ? 'opacity-50 scale-95' : ''}`}
      draggable
      onDragStart={() => onDragStart(initiative)}
      onDragEnd={onDragEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-sm flex-1 pr-2">{initiative.title}</h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(initiative);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit"
            >
              <Edit2 className="w-3 h-3 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this initiative?")) {
                  onDelete(initiative.id);
                }
              }}
              className="p-1 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{initiative.description}</p>

        <div className="space-y-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3" />
            <span>{initiative.team}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(initiative.target_date)}</span>
          </div>
        </div>

        {/* Action Items */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              Action Items ({completedActions}/{totalActions})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddActionItem(initiative);
              }}
              className="text-blue-600 hover:text-blue-700"
              title="Add action item"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {initiative.action_items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 text-xs group/item"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleActionItem(initiative.id, item.id);
                  }}
                  className="mt-0.5"
                >
                  {item.completed ? (
                    <CheckSquare className="w-3 h-3 text-green-600" />
                  ) : (
                    <Square className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                <span
                  className={`flex-1 ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                >
                  {item.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteActionItem(initiative.id, item.id);
                  }}
                  className="opacity-0 group-hover/item:opacity-100"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ))}
            {initiative.action_items.length > 3 && (
              <p className="text-xs text-gray-400 italic">
                +{initiative.action_items.length - 3} more
              </p>
            )}
          </div>
        </div>

        {/* Risks */}
        {initiative.risks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
              <Shield className="w-3 h-3" />
              <span className="font-medium">Risks: {initiative.risks.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {initiative.risks.slice(0, 2).map((risk) => {
                const sevConfig = RISK_SEVERITIES.find((s) => s.value === risk.severity);
                return (
                  <Badge key={risk.id} className={`${sevConfig?.color} text-xs py-0 px-1`}>
                    {risk.severity}
                  </Badge>
                );
              })}
              {initiative.risks.length > 2 && (
                <span className="text-xs text-gray-400">+{initiative.risks.length - 2}</span>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress (auto)</span>
            <span className="font-medium">{initiative.progress}%</span>
          </div>
          <Progress value={initiative.progress} className="h-1" />
        </div>
      </CardContent>
    </Card>
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
        status: "todo",
        start_date: "",
        target_date: "",
        ai_assistants: [],
        objectives: [],
        action_items: [],
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

        <div className="grid grid-cols-2 gap-4">
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

        <Select
          label="Status"
          value={formData.status || "todo"}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as AIInitiative["status"] })}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

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

function ActionItemModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, assignee?: string, due_date?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, assignee || undefined, dueDate || undefined);
    setTitle("");
    setAssignee("");
    setDueDate("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Action Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Action Item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
        />

        <Input
          label="Assignee (optional)"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Who is responsible?"
        />

        <Input
          label="Due Date (optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Action Item</Button>
        </div>
      </form>
    </Modal>
  );
}
