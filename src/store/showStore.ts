import { supabase } from '../lib/supabase';
import { Show, CreateShowInput, ShowReminder, MaterialItem } from '../types/show';

function generateId(): string {
  return `show_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) { console.error('loadShows:', error); return []; }
  return (data ?? []).map((row) => row.data as Show);
}

export async function createShow(input: CreateShowInput): Promise<Show> {
  const now = new Date().toISOString();
  const show: Show = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  const { error } = await supabase.from('shows').insert({
    id: show.id,
    data: show,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return show;
}

export async function updateShow(id: string, changes: Partial<Show>): Promise<Show | null> {
  const { data, error: fetchError } = await supabase
    .from('shows')
    .select('data')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  if (!data) return null;
  const now = new Date().toISOString();
  const updated: Show = { ...(data.data as Show), ...changes, updatedAt: now };
  const { error } = await supabase
    .from('shows')
    .update({ data: updated, updated_at: now })
    .eq('id', id);
  if (error) throw error;
  return updated;
}

export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase.from('shows').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleShowReminder(showId: string, reminderId: string): Promise<Show | null> {
  const { data, error: fetchError } = await supabase
    .from('shows')
    .select('data')
    .eq('id', showId)
    .single();
  if (fetchError || !data) return null;
  const show = data.data as Show;
  const reminders = (show.reminders ?? []).map((r) =>
    r.id === reminderId ? { ...r, done: !r.done } : r,
  );
  return updateShow(showId, { reminders });
}

export function buildReminder(text: string, notifyAt?: string, notificationId?: string): ShowReminder {
  return { id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, done: false, notifyAt, notificationId };
}

export async function setReminderNotification(
  showId: string,
  reminderId: string,
  notifyAt: string | null,
  notificationId: string | null,
): Promise<Show | null> {
  const { data, error } = await supabase.from('shows').select('data').eq('id', showId).single();
  if (error || !data) return null;
  const show = data.data as Show;
  const reminders = (show.reminders ?? []).map((r) =>
    r.id === reminderId
      ? { ...r, notifyAt: notifyAt ?? undefined, notificationId: notificationId ?? undefined }
      : r,
  );
  return updateShow(showId, { reminders });
}

export function buildMaterialItem(name: string): MaterialItem {
  return { id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, checked: false };
}

export async function toggleMaterialItem(showId: string, itemId: string): Promise<Show | null> {
  const { data, error: fetchError } = await supabase
    .from('shows')
    .select('data')
    .eq('id', showId)
    .single();
  if (fetchError || !data) return null;
  const show = data.data as Show;
  const materials = (show.materials ?? []).map((m) =>
    m.id === itemId ? { ...m, checked: !m.checked } : m,
  );
  return updateShow(showId, { materials });
}
