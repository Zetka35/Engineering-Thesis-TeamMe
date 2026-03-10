import type { Team } from "../models/Team";
import { get } from "./http";

const MOCK = false;

const mockTeams: Team[] = [
  {
    id: 1,
    name: "Super Zespół",
    role: "Implementer",
    members: ["Jan Kowalski [S]"],
    meetingDate: "2025-05-15T14:00:00",
  },
  {
    id: 2,
    name: "Prezentacja",
    role: "Implementer",
    members: ["Anna Kowalska [P]"],
    meetingDate: "2025-05-22T10:00:00",
  },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchTeams(): Promise<Team[]> {
  if (MOCK) {
    await sleep(250);
    return mockTeams;
  }

  // backend: GET /api/teams
  return await get<Team[]>("/api/teams");
}