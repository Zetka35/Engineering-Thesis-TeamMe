import type {
  RecruitmentRequest,
  TeamDetails,
  TeamSummary,
  TeamExperienceLevel,
  TeamRecruitmentStatus,
} from "../models/Team";
import { get, post, put } from "./http";

export type TechnologyInputPayload = {
  name: string;
  requiredLevel?: number | null;
  required?: boolean | null;
};

export type RoleRequirementInputPayload = {
  roleName: string;
  slots: number;
  description?: string;
  priority: number;
};

export type TeamUpsertPayload = {
  name: string;
  description: string;
  expectedTimeText: string;
  maxMembers: number;
  projectArea: string;
  experienceLevel: TeamExperienceLevel;
  recruitmentStatus: TeamRecruitmentStatus;
  technologies: TechnologyInputPayload[];
  roleRequirements: RoleRequirementInputPayload[];
};

export type MeetingCreatePayload = {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
};

export type TaskCreatePayload = {
  title: string;
  description: string;
  dueAt?: string;
  assigneeUserId?: number | null;
};

export type ApplyToTeamPayload = {
  targetRoleName?: string | null;
  message?: string;
};

export type InviteToTeamPayload = {
  username: string;
  targetRoleName?: string | null;
  message?: string;
};

export type RespondToRequestPayload = {
  decision: "ACCEPTED" | "REJECTED" | "CANCELLED";
};

export function fetchTeams(): Promise<TeamSummary[]> {
  return get<TeamSummary[]>("/api/teams");
}

export function searchTeams(): Promise<TeamSummary[]> {
  return get<TeamSummary[]>("/api/teams/search");
}

export function fetchTeam(teamId: number): Promise<TeamDetails> {
  return get<TeamDetails>(`/api/teams/${teamId}`);
}

export function createTeam(payload: TeamUpsertPayload): Promise<TeamDetails> {
  return post<TeamDetails>("/api/teams", payload);
}

export function updateTeam(teamId: number, payload: TeamUpsertPayload): Promise<TeamDetails> {
  return put<TeamDetails>(`/api/teams/${teamId}`, payload);
}

export function createMeeting(teamId: number, payload: MeetingCreatePayload): Promise<TeamDetails> {
  return post<TeamDetails>(`/api/teams/${teamId}/meetings`, payload);
}

export function createTask(teamId: number, payload: TaskCreatePayload): Promise<TeamDetails> {
  return post<TeamDetails>(`/api/teams/${teamId}/tasks`, payload);
}

export function applyToTeam(
  teamId: number,
  payload: ApplyToTeamPayload
): Promise<RecruitmentRequest> {
  return post<RecruitmentRequest>(`/api/teams/${teamId}/apply`, payload);
}

export function inviteToTeam(
  teamId: number,
  payload: InviteToTeamPayload
): Promise<RecruitmentRequest> {
  return post<RecruitmentRequest>(`/api/teams/${teamId}/invite`, payload);
}

export function listTeamRequests(teamId: number): Promise<RecruitmentRequest[]> {
  return get<RecruitmentRequest[]>(`/api/teams/${teamId}/requests`);
}

export function fetchMyRecruitmentRequests(): Promise<RecruitmentRequest[]> {
  return get<RecruitmentRequest[]>("/api/teams/requests/mine");
}

export function respondToRequest(
  requestId: number,
  payload: RespondToRequestPayload
): Promise<RecruitmentRequest> {
  return post<RecruitmentRequest>(`/api/teams/requests/${requestId}/respond`, payload);
}