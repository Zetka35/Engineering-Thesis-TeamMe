import type { User } from "../auth/AuthContext";

type MockUserRecord = { username: string; password: string };

const MOCK_DB_KEY = "teamme:mock_users";

function readUsers(): MockUserRecord[] {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) return [{ username: "admin", password: "admin" }]; // konto testowe
  try {
    return JSON.parse(raw);
  } catch {
    return [{ username: "admin", password: "admin" }];
  }
}

function writeUsers(users: MockUserRecord[]) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(users));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function login(username: string, password: string): Promise<User> {
  await sleep(450);
  const users = readUsers();
  const found = users.find((u) => u.username === username && u.password === password);
  if (!found) throw new Error("Błędne dane logowania");
  return { username: found.username };
}

export async function register(username: string, password: string): Promise<User> {
  await sleep(550);
  const users = readUsers();
  const exists = users.some((u) => u.username === username);
  if (exists) throw new Error("Użytkownik o tej nazwie już istnieje");

  const next = [...users, { username, password }];
  writeUsers(next);

  return { username };
}