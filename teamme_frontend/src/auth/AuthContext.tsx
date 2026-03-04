import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api";

export interface User {
  username: string;
  avatarDataUrl?: string; // base64 do podglądu (na razie mock)
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
  updateAvatar: (avatarDataUrl: string | undefined) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "teamme:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persist = (u: User | null) => {
    if (!u) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      login: async (username, password) => {
        const u = await authApi.login(username, password);
        // jeśli jest zapisany avatar z poprzedniej sesji, zachowaj go (opcjonalnie)
        const existing = localStorage.getItem(STORAGE_KEY);
        let avatarDataUrl: string | undefined;
        if (existing) {
          try {
            avatarDataUrl = (JSON.parse(existing) as User)?.avatarDataUrl;
          } catch {}
        }
        const merged: User = { ...u, avatarDataUrl };
        persist(merged);
        setUser(merged);
        return merged;
      },
      register: async (username, password) => {
        const u = await authApi.register(username, password);
        const merged: User = { ...u, avatarDataUrl: undefined };
        persist(merged);
        setUser(merged);
        return merged;
      },
      logout: () => {
        persist(null);
        setUser(null);
      },
      updateAvatar: (avatarDataUrl) => {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, avatarDataUrl };
          persist(next);
          return next;
        });
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}