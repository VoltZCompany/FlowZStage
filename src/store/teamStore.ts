import { supabase } from '../lib/supabase';
import { TeamMember, CreateTeamMemberInput } from '../types/team';

function generateId(): string {
  return `member_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('data')
    .order('created_at', { ascending: true });
  if (error) { console.error('loadTeamMembers:', error); return []; }
  return (data ?? []).map((row) => row.data as TeamMember);
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const now = new Date().toISOString();
  const member: TeamMember = {
    id: generateId(),
    name: input.name.trim().toUpperCase(),
    role: input.role.trim(),
    isArtist: input.isArtist ?? false,
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await supabase.from('team_members').insert({
    id: member.id,
    data: member,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return member;
}

export async function updateTeamMember(id: string, changes: Partial<Pick<TeamMember, 'name' | 'role' | 'isArtist'>>): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('team_members')
    .select('data')
    .eq('id', id)
    .single();
  if (fetchError || !data) throw fetchError;
  const now = new Date().toISOString();
  const updated: TeamMember = {
    ...(data.data as TeamMember),
    ...(changes.name !== undefined ? { name: changes.name.trim().toUpperCase() } : {}),
    ...(changes.role !== undefined ? { role: changes.role.trim() } : {}),
    ...(changes.isArtist !== undefined ? { isArtist: changes.isArtist } : {}),
    updatedAt: now,
  };
  const { error } = await supabase
    .from('team_members')
    .update({ data: updated, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}
