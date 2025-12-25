// Local Storage utilities for persisting data

const STORAGE_KEYS = {
  AI_ASSISTANTS: "ai-os-assistants",
  AI_INITIATIVES: "ai-os-initiatives",
  COPILOT_METRICS: "ai-os-copilot-metrics",
  TEAM_MATURITY: "ai-os-team-maturity",
  VALUE_RECORDS: "ai-os-value-records",
  LEARNING_PROGRESS: "ai-os-learning-progress",
  ASSESSMENTS: "ai-os-assessments",
  MODEL_CARDS: "ai-os-model-cards",
  USE_CASES: "ai-os-use-cases",
} as const;

export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
}

export { STORAGE_KEYS };
