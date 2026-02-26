import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api";

export interface User {
  username: string;
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
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

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      login: async (username, password) => {
        const u = await authApi.login(username, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
        return u;
      },
      register: async (username, password) => {
        const u = await authApi.register(username, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
        return u;
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
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