import type { User } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

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

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

function jsonHeadersWithCsrf(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = readCookie("XSRF-TOKEN");
  if (token) {
    headers["X-XSRF-TOKEN"] = token;
  }

  return headers;
}

export async function fetchCsrfToken(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Nie udało się pobrać tokenu CSRF: HTTP ${res.status}`);
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: jsonHeadersWithCsrf(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as T;
}


export async function login(username: string, password: string): Promise<User> {
  await fetchCsrfToken();
  return postJson<User>("/api/auth/login", { username, password });
}

export async function register(username: string, password: string): Promise<User> {
  await fetchCsrfToken();
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