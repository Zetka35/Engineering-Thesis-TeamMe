export interface TeamSummary {
  id: number;
  name: string;
  description?: string | null;
  expectedTimeText?: string | null;
  maxMembers: number;
  memberCount: number;
  myRole: string;
  nextMeetingAt?: string | null;
}

export interface TeamMember {
  userId: number;
  username: string;
  fullName: string;
  roleLabel: string;
}

export interface TeamMeeting {
  id: number;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
}

export interface TeamTask {
  id: number;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueAt?: string | null;
  assigneeUserId?: number | null;
  assigneeUsername?: string | null;
}

export interface TeamDetails {
  id: number;
  name: string;
  description?: string | null;
  expectedTimeText?: string | null;
  maxMembers: number;
  status: string;
  ownerUsername?: string | null;
  myRole: string;
  members: TeamMember[];
  meetings: TeamMeeting[];
  tasks: TeamTask[];
}