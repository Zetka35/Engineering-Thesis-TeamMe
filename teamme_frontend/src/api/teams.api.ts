import type { TeamDetails, TeamSummary } from "../models/Team";
import { get, post, put } from "./http";

export type TeamUpsertPayload = {
  name: string;
  description: string;
  expectedTimeText: string;
  maxMembers: number;
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

export function fetchTeams(): Promise<TeamSummary[]> {
  return get<TeamSummary[]>("/api/teams");
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