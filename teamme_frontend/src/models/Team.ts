export type TeamExperienceLevel =
  | "BEGINNER"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "MIXED";

export type TeamRecruitmentStatus =
  | "OPEN"
  | "PAUSED"
  | "CLOSED"
  | "FULL";

export type TeamProjectStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED"
  | string;

export type RecruitmentRequestType = "APPLICATION" | "INVITATION";

export type RecruitmentRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export interface TeamSummary {
  id: number;
  name: string;
  description?: string | null;
  expectedTimeText?: string | null;
  maxMembers: number;
  memberCount: number;
  myRole?: string | null;
  nextMeetingAt?: string | null;
  projectArea?: string | null;
  experienceLevel: TeamExperienceLevel;
  recruitmentStatus: TeamRecruitmentStatus;
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
  status: "TODO" | "IN_PROGRESS" | "DONE" | string;
  dueAt?: string | null;
  assigneeUserId?: number | null;
  assigneeUsername?: string | null;
}

export interface TeamTechnology {
  id: number;
  name: string;
  requiredLevel?: number | null;
  required: boolean;
}

export interface TeamRoleRequirement {
  id: number;
  roleName: string;
  slots: number;
  description?: string | null;
  priority: number;
  status: "OPEN" | "FILLED" | "CLOSED" | string;
}

export interface RecruitmentRequest {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  requestType: RecruitmentRequestType;
  status: RecruitmentRequestStatus;
  targetRoleName?: string | null;
  message?: string | null;
  createdByUsername?: string | null;
  respondedByUsername?: string | null;
  createdAt?: string | null;
  respondedAt?: string | null;
}

export interface TeamDetails {
  id: number;
  name: string;
  description?: string | null;
  expectedTimeText?: string | null;
  maxMembers: number;
  status: TeamProjectStatus;
  recruitmentStatus: TeamRecruitmentStatus;
  projectArea?: string | null;
  experienceLevel: TeamExperienceLevel;
  ownerUsername?: string | null;
  myRole: string;
  members: TeamMember[];
  technologies: TeamTechnology[];
  roleRequirements: TeamRoleRequirement[];
  recruitmentRequests: RecruitmentRequest[];
  meetings: TeamMeeting[];
  tasks: TeamTask[];
}