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
    let msg = "Wystąpił błąd";
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch {}
    throw new Error(msg);
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