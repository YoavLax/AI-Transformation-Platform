"use client";

import { useState, useEffect, useMemo } from "react";
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
import { TrendChart, HorizontalBarChart } from "@/components/charts";
import {
  BarChart3,
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Calculator,
  Zap,
  Users,
  Code,
  GitPullRequest,
  Bug,
  Trash2,
  Edit,
} from "lucide-react";
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/storage";
import { generateId, formatDate, formatCurrency } from "@/lib/utils";

// Engineering-focused value categories
type ValueCategory = 
  | "time_savings" 
  | "cost_avoidance" 
  | "productivity" 
  | "quality" 
  | "developer_experience";

interface EngineeringValueRecord {
  id: string;
  category: ValueCategory;
  team: string;
  tool: string;
  kpi: string;
  value: number;
  target: number;
  unit: string;
  date: string;
  usecase_id?: string;
  usecase_title?: string;
  methodology?: string;
  notes?: string;
}

interface ROIInputs {
  developers: number;
  avgSalary: number;
  timeSavedHoursPerWeek: number;
  toolCostPerMonth: number;
}

const VALUE_CATEGORIES: { value: ValueCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "time_savings", label: "Time Savings", icon: <Clock className="w-4 h-4" />, color: "blue" },
  { value: "cost_avoidance", label: "Cost Avoidance", icon: <DollarSign className="w-4 h-4" />, color: "green" },
  { value: "productivity", label: "Productivity Gain", icon: <Zap className="w-4 h-4" />, color: "yellow" },
  { value: "quality", label: "Quality Improvement", icon: <Bug className="w-4 h-4" />, color: "purple" },
  { value: "developer_experience", label: "Developer Experience", icon: <Users className="w-4 h-4" />, color: "pink" },
];

const SAMPLE_RECORDS: EngineeringValueRecord[] = [];

export default function ValueTrackingPage() {
  const [valueRecords, setValueRecords] = useState<EngineeringValueRecord[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EngineeringValueRecord | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ValueCategory | "all">("all");

  const [formData, setFormData] = useState<Partial<EngineeringValueRecord>>({
    category: "time_savings",
    team: "",
    tool: "",
    kpi: "",
    value: 0,
    target: 100,
    unit: "",
  });

  const [roiInputs, setRoiInputs] = useState<ROIInputs>({
    developers: 50,
    avgSalary: 120000,
    timeSavedHoursPerWeek: 5,
    toolCostPerMonth: 19,
  });

  useEffect(() => {
    const storedRecords = getFromStorage<EngineeringValueRecord[]>(STORAGE_KEYS.VALUE_RECORDS, []);
    setValueRecords(storedRecords);
  }, []);

  const filteredRecords = useMemo(() => {
    if (categoryFilter === "all") return valueRecords;
    return valueRecords.filter((r) => r.category === categoryFilter);
  }, [valueRecords, categoryFilter]);

  const handleSaveRecord = () => {
    if (editingRecord) {
      const updated = valueRecords.map((r) =>
        r.id === editingRecord.id
          ? { ...r, ...formData, date: new Date().toISOString() }
          : r
      );
      setValueRecords(updated);
      setToStorage(STORAGE_KEYS.VALUE_RECORDS, updated);
    } else {
      const record: EngineeringValueRecord = {
        id: generateId(),
        category: formData.category as ValueCategory,
        team: formData.team || "",
        tool: formData.tool || "",
        kpi: formData.kpi || "",
        value: formData.value || 0,
        target: formData.target || 100,
        unit: formData.unit || "",
        date: new Date().toISOString(),
        usecase_id: formData.category || "",
        usecase_title: VALUE_CATEGORIES.find((c) => c.value === formData.category)?.label || "",
      };

      const updated = [record, ...valueRecords];
      setValueRecords(updated);
      setToStorage(STORAGE_KEYS.VALUE_RECORDS, updated);
    }

    setShowModal(false);
    setEditingRecord(null);
    resetForm();
  };

  const handleDeleteRecord = (id: string) => {
    const updated = valueRecords.filter((r) => r.id !== id);
    setValueRecords(updated);
    setToStorage(STORAGE_KEYS.VALUE_RECORDS, updated);
  };

  const handleEditRecord = (record: EngineeringValueRecord) => {
    setEditingRecord(record);
    setFormData({
      category: record.category,
      team: record.team,
      tool: record.tool,
      kpi: record.kpi,
      value: record.value,
      target: record.target,
      unit: record.unit,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      category: "time_savings",
      team: "",
      tool: "",
      kpi: "",
      value: 0,
      target: 100,
      unit: "",
    });
  };

  // ROI Calculations
  const calculateROI = () => {
    const { developers, avgSalary, timeSavedHoursPerWeek, toolCostPerMonth } = roiInputs;
    
    const hourlyRate = avgSalary / 2080; // 52 weeks * 40 hours
    const weeklySavings = developers * timeSavedHoursPerWeek * hourlyRate;
    const annualSavings = weeklySavings * 52;
    const annualToolCost = toolCostPerMonth * developers * 12;
    const netAnnualValue = annualSavings - annualToolCost;
    const roiPercentage = ((annualSavings - annualToolCost) / annualToolCost) * 100;
    const paybackDays = Math.ceil((annualToolCost / annualSavings) * 365);

    return {
      hourlyRate: Math.round(hourlyRate),
      weeklySavings: Math.round(weeklySavings),
      annualSavings: Math.round(annualSavings),
      annualToolCost: Math.round(annualToolCost),
      netAnnualValue: Math.round(netAnnualValue),
      roiPercentage: Math.round(roiPercentage),
      paybackDays,
    };
  };

  // Aggregate data for charts
  const trendData = filteredRecords
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)
    .map((r) => ({
      date: formatDate(r.date),
      value: Math.round((r.value / r.target) * 100),
    }));

  const categoryPerformance = VALUE_CATEGORIES.map((cat) => {
    const records = valueRecords.filter((r) => r.category === cat.value);
    const avgValue = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + (r.value / r.target) * 100, 0) / records.length)
      : 0;
    return {
      name: cat.label,
      value: avgValue,
    };
  });

  const teamBreakdown = useMemo(() => {
    const teams = [...new Set(valueRecords.map((r) => r.team))];
    return teams.map((team) => {
      const records = valueRecords.filter((r) => r.team === team);
      const avgProgress = Math.round(
        records.reduce((sum, r) => sum + (r.value / r.target) * 100, 0) / records.length
      );
      return { name: team, value: avgProgress };
    });
  }, [valueRecords]);

  // Stats calculations
  const totalTimeSaved = valueRecords
    .filter((r) => r.category === "time_savings")
    .reduce((sum, r) => sum + r.value, 0);

  const avgTargetProgress = valueRecords.length > 0
    ? Math.round(valueRecords.reduce((sum, r) => sum + (r.value / r.target) * 100, 0) / valueRecords.length)
    : 0;

  const teamsTracked = new Set(valueRecords.map((r) => r.team)).size;

  const roi = calculateROI();

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "records", label: "Value Records" },
    { id: "roi", label: "ROI Calculator" },
  ];

  const categoryOptions = [
    { value: "", label: "Select Category" },
    ...VALUE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];

  const teamOptions = [
    { value: "", label: "Select Team" },
    { value: "Platform Team", label: "Platform Team" },
    { value: "Backend Team", label: "Backend Team" },
    { value: "Frontend Team", label: "Frontend Team" },
    { value: "DevOps", label: "DevOps" },
    { value: "Mobile Team", label: "Mobile Team" },
    { value: "All Teams", label: "All Teams" },
  ];

  const toolOptions = [
    { value: "", label: "Select Tool" },
    { value: "GitHub Copilot", label: "GitHub Copilot" },
    { value: "ChatGPT Enterprise", label: "ChatGPT Enterprise" },
    { value: "AI Security Scanner", label: "AI Security Scanner" },
    { value: "AI Code Review", label: "AI Code Review" },
    { value: "AI Documentation", label: "AI Documentation" },
  ];

  const getCategoryColor = (category: ValueCategory): string => {
    const colors: Record<ValueCategory, string> = {
      time_savings: "blue",
      cost_avoidance: "green",
      productivity: "yellow",
      quality: "purple",
      developer_experience: "pink",
    };
    return colors[category];
  };

  return (
    <div>
      <PageHeader
        title="Value Tracking"
        description="Measure and track AI tool value for engineering teams"
        icon={BarChart3}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Value Record
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Time Saved Weekly"
          value={`${totalTimeSaved}h`}
          icon={Clock}
          change={12}
          changeLabel="vs last week"
        />
        <StatCard
          title="Avg. Target Progress"
          value={`${avgTargetProgress}%`}
          icon={Target}
          change={5}
          changeLabel="vs last month"
        />
        <StatCard
          title="Teams Tracked"
          value={teamsTracked}
          icon={Users}
        />
        <StatCard
          title="Est. Annual ROI"
          value={`${roi.roiPercentage}%`}
          icon={TrendingUp}
          change={roi.roiPercentage > 100 ? 8 : -5}
          changeLabel="projected"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Categories
            </Button>
            {VALUE_CATEGORIES.map((cat) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Value Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Target Achievement Trend</CardTitle>
                <CardDescription>Progress towards targets over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <TrendChart data={trendData} color="#22c55e" />
                ) : (
                  <EmptyState
                    title="No data yet"
                    description="Add value records to see trends"
                  />
                )}
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Category</CardTitle>
                <CardDescription>Average target achievement per category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPerformance.some((c) => c.value > 0) ? (
                  <HorizontalBarChart
                    data={categoryPerformance}
                    valueFormatter={(v) => `${v}%`}
                  />
                ) : (
                  <EmptyState
                    title="No performance data"
                    description="Track values to see performance"
                  />
                )}
              </CardContent>
            </Card>

            {/* Team Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Value achievement by team</CardDescription>
              </CardHeader>
              <CardContent>
                {teamBreakdown.length > 0 ? (
                  <HorizontalBarChart
                    data={teamBreakdown}
                    valueFormatter={(v) => `${v}%`}
                  />
                ) : (
                  <EmptyState
                    title="No team data"
                    description="Add records with team information"
                  />
                )}
              </CardContent>
            </Card>

            {/* Quick Value Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Value Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {VALUE_CATEGORIES.map((cat) => {
                    const records = valueRecords.filter((r) => r.category === cat.value);
                    const count = records.length;
                    const avgProgress = count > 0
                      ? Math.round(records.reduce((sum, r) => sum + (r.value / r.target) * 100, 0) / count)
                      : 0;

                    return (
                      <div key={cat.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${cat.color}-100`}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cat.label}</p>
                            <p className="text-sm text-gray-500">{count} records</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{avgProgress}%</p>
                          <p className="text-xs text-gray-500">avg. progress</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Value Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Value Records</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <EmptyState
                  title="No records yet"
                  description="Start tracking value to see updates here"
                />
              ) : (
                <div className="space-y-4">
                  {filteredRecords.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{record.kpi}</h4>
                          <Badge variant={getCategoryColor(record.category) as any}>
                            {VALUE_CATEGORIES.find((c) => c.value === record.category)?.label}
                          </Badge>
                          <Badge variant="default">{record.team}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            {record.tool}
                          </span>
                          <span>{formatDate(record.date)}</span>
                        </div>
                        <Progress
                          value={record.value}
                          max={record.target}
                          showLabel
                          color={record.value >= record.target ? "green" : "blue"}
                          className="mt-2"
                        />
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold text-gray-900">
                          {record.value} {record.unit}
                        </p>
                        <p className="text-sm text-gray-500">
                          Target: {record.target} {record.unit}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "records" && (
        <Card>
          <CardHeader>
            <CardTitle>All Value Records</CardTitle>
            <CardDescription>Complete history of value tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {valueRecords.length === 0 ? (
              <EmptyState
                icon={<Target className="w-8 h-8 text-gray-400" />}
                title="No value records yet"
                description="Start tracking the value of your AI tools for engineering."
                action={
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Value Record
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Team</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tool</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">KPI</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Value</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueRecords.map((record) => {
                      const progress = Math.round((record.value / record.target) * 100);
                      return (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(record.date)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getCategoryColor(record.category) as any}>
                              {VALUE_CATEGORIES.find((c) => c.value === record.category)?.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{record.team}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{record.tool}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{record.kpi}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {record.value} / {record.target} {record.unit}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={record.value}
                                max={record.target}
                                className="w-24"
                                color={progress >= 100 ? "green" : progress >= 75 ? "blue" : "yellow"}
                              />
                              <span className="text-sm font-medium text-gray-600">{progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteRecord(record.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "roi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Engineering ROI Calculator</CardTitle>
              <CardDescription>Calculate return on investment for AI coding tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Number of Developers"
                  type="number"
                  value={roiInputs.developers}
                  onChange={(e) => setRoiInputs({ ...roiInputs, developers: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Average Annual Salary ($)"
                  type="number"
                  value={roiInputs.avgSalary}
                  onChange={(e) => setRoiInputs({ ...roiInputs, avgSalary: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Time Saved Per Developer (hours/week)"
                  type="number"
                  step="0.5"
                  value={roiInputs.timeSavedHoursPerWeek}
                  onChange={(e) => setRoiInputs({ ...roiInputs, timeSavedHoursPerWeek: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Tool Cost Per User ($/month)"
                  type="number"
                  value={roiInputs.toolCostPerMonth}
                  onChange={(e) => setRoiInputs({ ...roiInputs, toolCostPerMonth: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI Results</CardTitle>
              <CardDescription>Based on GitHub Copilot industry benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Return on Investment</p>
                  <p className={`text-4xl font-bold ${roi.roiPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {roi.roiPercentage >= 0 ? "+" : ""}{roi.roiPercentage}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Developer Hourly Rate</p>
                    <p className="text-xl font-semibold text-gray-900">${roi.hourlyRate}/hr</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Weekly Savings</p>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(roi.weeklySavings)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Annual Value Generated</p>
                    <p className="text-xl font-semibold text-blue-700">{formatCurrency(roi.annualSavings)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Annual Tool Cost</p>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(roi.annualToolCost)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Net Annual Value</p>
                    <p className={`text-xl font-semibold ${roi.netAnnualValue >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {formatCurrency(roi.netAnnualValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Payback Period</p>
                    <p className="text-xl font-semibold text-purple-700">{roi.paybackDays} days</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Based on industry research showing GitHub Copilot saves developers 
                    an average of 55% time on repetitive coding tasks. Actual results may vary.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional ROI Metrics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Extended Value Metrics</CardTitle>
              <CardDescription>Additional value considerations beyond direct time savings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GitPullRequest className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Faster Time to Market</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    With {roiInputs.timeSavedHoursPerWeek}h saved per developer weekly, your team gains:
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(roiInputs.developers * roiInputs.timeSavedHoursPerWeek * 52)} hours/year
                  </p>
                  <p className="text-sm text-gray-500">of additional development capacity</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Bug className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Quality Improvement</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    AI-assisted code typically shows 15-30% fewer bugs in review:
                  </p>
                  <p className="text-2xl font-bold text-green-600">~25%</p>
                  <p className="text-sm text-gray-500">estimated bug reduction</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Developer Satisfaction</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Studies show developers using AI tools report higher job satisfaction:
                  </p>
                  <p className="text-2xl font-bold text-purple-600">+35%</p>
                  <p className="text-sm text-gray-500">improvement in satisfaction scores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Value Record Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRecord(null);
          resetForm();
        }}
        title={editingRecord ? "Edit Value Record" : "Add Value Record"}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Value Category"
            options={categoryOptions}
            value={formData.category || ""}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ValueCategory })}
          />
          <Select
            label="Team"
            options={teamOptions}
            value={formData.team || ""}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          />
          <Select
            label="AI Tool"
            options={toolOptions}
            value={formData.tool || ""}
            onChange={(e) => setFormData({ ...formData, tool: e.target.value })}
          />
          <Input
            label="KPI Name"
            placeholder="e.g., Code Generation Time, Bug Detection Rate"
            value={formData.kpi || ""}
            onChange={(e) => setFormData({ ...formData, kpi: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Value"
              type="number"
              step="0.1"
              placeholder="35"
              value={formData.value || ""}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Target Value"
              type="number"
              step="0.1"
              placeholder="50"
              value={formData.target || ""}
              onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Unit"
            placeholder="e.g., hours/week, %, PRs"
            value={formData.unit || ""}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingRecord(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRecord}>
              {editingRecord ? "Save Changes" : "Add Record"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
