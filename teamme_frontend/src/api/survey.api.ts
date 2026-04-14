import { get, post, put } from "./http";
import type { Likert, SurveyPart, SurveyStatus } from "../survey/teamRoleSurvey";


export interface DimensionScoreDto {
  key: string;
  rawScore: number;
  normalizedScore: number;
}

export interface RoleScoreDto {
  key: string;
  baseScore: number;
  adjustmentScore: number;
  finalScore: number;
  explanation: string;
  recommended: boolean;
}

export interface SurveyResultDto {
  surveyVersion: number;
  alpha: number;
  bigFive: DimensionScoreDto[];
  teamwork: DimensionScoreDto[];
  allRoles: RoleScoreDto[];
  topRoles: RoleScoreDto[];
}

export interface SurveyStateDto {
  surveyVersion: number;
  status: SurveyStatus;
  currentPart: SurveyPart;
  currentPage: number;
  miniIpipAnswers: Array<Likert | null>;
  teamworkAnswers: Array<Likert | null>;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: SurveyResultDto | null;
}

export interface SaveDraftPayload {
  miniIpipAnswers: Array<Likert | null>;
  teamworkAnswers: Array<Likert | null>;
  currentPart: SurveyPart;
  currentPage: number;
}

export interface CompletePayload {
  miniIpipAnswers: Likert[];
  teamworkAnswers: Likert[];
}

export async function getMySurveyState(): Promise<SurveyStateDto> {
  return get<SurveyStateDto>("/api/surveys/team-role/me");
}

export async function saveMySurveyDraft(payload: SaveDraftPayload): Promise<SurveyStateDto> {
  return put<SurveyStateDto>("/api/surveys/team-role/me/draft", payload);
}

export async function completeMySurvey(payload: CompletePayload): Promise<SurveyStateDto> {
  return post<SurveyStateDto>("/api/surveys/team-role/me/complete", payload);
}