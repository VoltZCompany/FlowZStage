export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isArtist?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTeamMemberInput = Pick<TeamMember, 'name' | 'role' | 'isArtist'>;
