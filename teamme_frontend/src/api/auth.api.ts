import type { User } from "../auth/AuthContext";

const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ważne: cookie z JWT będzie działać
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // backend zwykle zwraca komunikat; uprośćmy:
    let msg = "Wystąpił błąd";
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export async function login(username: string, password: string): Promise<User> {
  return await postJson<User>("/api/auth/login", { username, password });
}

export async function register(username: string, password: string): Promise<User> {
  return await postJson<User>("/api/auth/register", { username, password });
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