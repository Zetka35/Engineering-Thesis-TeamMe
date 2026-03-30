import type { User } from "../auth/AuthContext";

const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function updateSelectedRole(selectedRole: string): Promise<User> {
  return putJson<User>("/api/users/me/selected-role", { selectedRole });
}

export async function updateMyProfile(payload: {
  firstName: string;
  lastName: string;
  bio: string;
}): Promise<User> {
  return putJson<User>("/api/users/me", payload);
}