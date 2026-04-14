import { get, put } from "./http";

export interface ExperienceItem {
  id?: number | null;
  companyName: string;
  position: string;
  employmentType?: string | null;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  description?: string | null;
}

export interface EducationItem {
  id?: number | null;
  schoolName: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  description?: string | null;
}

export interface SkillItem {
  id?: number | null;
  name: string;
  level?: number | null;
  category?: string | null;
}

export interface LanguageItem {
  id?: number | null;
  name: string;
  level?: string | null;
}

export interface ProjectHistoryItem {
  teamId: number;
  teamName: string;
  teamStatus?: string | null;
  roleLabel: string;
  joinedAt?: string | null;
  leftAt?: string | null;
  current: boolean;
}

export interface UserProfile {
  username: string;
  avatarUrl?: string | null;
  selectedRole?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  availabilityStatus?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  projectHistory: ProjectHistoryItem[];
}

export interface NetworkUser {
  username: string;
  avatarUrl?: string | null;
  selectedRole?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  availabilityStatus?: string | null;
  topSkills: SkillItem[];
  languages: LanguageItem[];
  latestProject?: ProjectHistoryItem | null;
}

export interface UpdateMyProfilePayload {
  firstName: string;
  lastName: string;
  bio: string;
  headline: string;
  location: string;
  availabilityStatus: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  experiences: Array<{
    companyName: string;
    position: string;
    employmentType: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string;
  }>;
  educations: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string;
  }>;
  skills: Array<{
    name: string;
    level: number | null;
    category: string;
  }>;
  languages: Array<{
    name: string;
    level: string;
  }>;
}

export async function getMyProfile(): Promise<UserProfile> {
  return get<UserProfile>("/api/users/me");
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  return get<UserProfile>(`/api/users/${encodeURIComponent(username)}`);
}

export async function getNetworkUsers(): Promise<NetworkUser[]> {
  return get<NetworkUser[]>("/api/users/network");
}

export async function updateSelectedRole(selectedRole: string): Promise<UserProfile> {
  return put<UserProfile>("/api/users/me/selected-role", { selectedRole });
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<UserProfile> {
  return put<UserProfile>("/api/users/me", payload);
}