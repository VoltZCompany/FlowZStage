export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  done: boolean;
  deadline?: string;
  notes?: string;
  categoryKey?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export interface AppSettings {
  dailySummary: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  recurringNudgeEnabled: boolean;
  recurringNudgeIntervalMinutes: number;
  deadlineAlertEnabled: boolean;
  deadlineAlertMinutesBefore: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dailySummary: {
    enabled: false,
    hour: 8,
    minute: 0,
  },
  recurringNudgeEnabled: false,
  recurringNudgeIntervalMinutes: 30,
  deadlineAlertEnabled: true,
  deadlineAlertMinutesBefore: 15,
};
