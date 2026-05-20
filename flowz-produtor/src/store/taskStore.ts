import { supabase } from '../lib/supabase';
import { Task, CreateTaskInput } from '../types/task';

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) { console.error('loadTasks:', error); return []; }
  return (data ?? []).map((row) => row.data as Task);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  const { error } = await supabase.from('tasks').insert({
    id: task.id,
    data: task,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return task;
}

export async function updateTask(id: string, changes: Partial<Task>): Promise<Task | null> {
  const { data, error: fetchError } = await supabase
    .from('tasks')
    .select('data')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  if (!data) return null;
  const now = new Date().toISOString();
  const updated: Task = { ...(data.data as Task), ...changes, updatedAt: now };
  const { error } = await supabase
    .from('tasks')
    .update({ data: updated, updated_at: now })
    .eq('id', id);
  if (error) throw error;
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleTask(id: string): Promise<Task | null> {
  const { data, error: fetchError } = await supabase
    .from('tasks')
    .select('data')
    .eq('id', id)
    .single();
  if (fetchError || !data) return null;
  const task = data.data as Task;
  return updateTask(id, { done: !task.done });
}
