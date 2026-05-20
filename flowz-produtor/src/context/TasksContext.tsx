import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';
import { AppSettings, DEFAULT_SETTINGS } from '../types/task';
import { loadTasks } from '../store/taskStore';

const SETTINGS_KEY = '@flowz_settings';

interface TasksContextValue {
  tasks: Task[];
  settings: AppSettings;
  updateSettings: (next: AppSettings) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue>({
  tasks: [],
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  refreshTasks: async () => {},
});

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refreshTasks = useCallback(async () => {
    const t = await loadTasks();
    if (mounted.current) setTasks(t);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw && mounted.current) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {}
  }, []);

  const updateSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    refreshTasks();
    loadSettings();
  }, [refreshTasks, loadSettings]);

  return (
    <TasksContext.Provider value={{ tasks, settings, updateSettings, refreshTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext(): TasksContextValue {
  return useContext(TasksContext);
}
