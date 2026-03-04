import type { SurveyResult } from "./miniIpip";

function key(username: string) {
  return `teamme:miniipip:${username}`;
}

export function loadSurvey(username: string): SurveyResult | null {
  const raw = localStorage.getItem(key(username));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SurveyResult;
  } catch {
    localStorage.removeItem(key(username));
    return null;
  }
}

export function saveSurvey(username: string, result: SurveyResult) {
  localStorage.setItem(key(username), JSON.stringify(result));
}

export function clearSurvey(username: string) {
  localStorage.removeItem(key(username));
}