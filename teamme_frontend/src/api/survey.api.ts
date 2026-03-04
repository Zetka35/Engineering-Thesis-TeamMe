import type { SurveyResult, Likert } from "../survey/miniIpip";
import { computeSurveyResult } from "../survey/miniIpip";
import { get } from "./http";

// Mock przechowuje per użytkownik w localStorage.
const MOCK = true;

const key = (username: string) => `teamme:miniipip:${username}`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchMySurvey(username: string): Promise<SurveyResult | null> {
  if (MOCK) {
    await sleep(250);
    const raw = localStorage.getItem(key(username));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SurveyResult;
    } catch {
      localStorage.removeItem(key(username));
      return null;
    }
  }

  // backend docelowo
  return get<SurveyResult | null>("/api/surveys/mini-ipip/me");
}

export async function submitMySurvey(username: string, answers: Likert[]): Promise<SurveyResult> {
  if (MOCK) {
    await sleep(350);
    const result = computeSurveyResult(answers);
    localStorage.setItem(key(username), JSON.stringify(result));
    return result;
  }

  // backend docelowo (przykład)
  const res = await fetch("http://localhost:8080/api/surveys/mini-ipip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as SurveyResult;
}

export async function clearMySurvey(username: string): Promise<void> {
  if (MOCK) {
    await sleep(150);
    localStorage.removeItem(key(username));
    return;
  }

  // backend docelowo
  const res = await fetch("http://localhost:8080/api/surveys/mini-ipip/me", {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}