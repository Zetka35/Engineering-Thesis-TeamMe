import type { User } from "../models/User";

// Typ danych do rejestracji
interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Mockowana baza użytkowników w frontendzie
let mockUsers: User[] = [];

// Mock rejestracji
export async function register(data: RegisterData): Promise<User> {
  const newUser: User = {
    id: Date.now(),
    username: data.username,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  };
  mockUsers.push(newUser);
  return new Promise(resolve => setTimeout(() => resolve(newUser), 500));
}

// Mock logowania
export async function login(username: string, password: string): Promise<User | null> {
  const user = mockUsers.find(u => u.username === username && u.password === password);
  return new Promise(resolve => setTimeout(() => resolve(user || null), 500));
}
