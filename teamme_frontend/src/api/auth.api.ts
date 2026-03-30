import type { User } from "../auth/AuthContext";

const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";

async function readErrorMessage(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  if (!raw) return `HTTP ${res.status} ${res.statusText}`;

  try {
    const parsed = JSON.parse(raw) as { message?: string };
    if (parsed?.message) return parsed.message;
  } catch {
  }

  return raw;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as T;
}

export async function login(username: string, password: string): Promise<User> {
  return postJson<User>("/api/auth/login", { username, password });
}

export async function register(username: string, password: string): Promise<User> {
  return postJson<User>("/api/auth/register", { username, password });
}

export async function logout(): Promise<void> {
  await postJson<void>("/api/auth/logout", {});
}

export async function me(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Brak sesji");
  return (await res.json()) as User;
}