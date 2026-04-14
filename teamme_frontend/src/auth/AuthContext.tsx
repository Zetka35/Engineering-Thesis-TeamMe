import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api";
import { me as meApi } from "../api/auth.api";

export interface User {
  username: string;
  avatarUrl?: string | null;
  avatarDataUrl?: string;
  selectedRole?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;

  headline?: string | null;
  location?: string | null;
  availabilityStatus?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
  updateAvatar: (avatarDataUrl: string | undefined) => void;
  setSelectedRole: (selectedRole: string | null) => void;
  mergeUser: (patch: Partial<User>) => void;
  refreshMe: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "teamme:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (u: User | null) => {
    if (!u) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

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

  const hydrateAndPersist = (incoming: User, previous?: User | null) => {
    const merged: User = {
      ...incoming,
      avatarDataUrl: previous?.avatarDataUrl,
    };
    persist(merged);
    return merged;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await meApi();
        if (mounted) {
          setUser((prev) => hydrateAndPersist(u, prev));
        }
      } catch {
        if (mounted) {
          persist(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,

      login: async (username, password) => {
        const u = await authApi.login(username, password);
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

      setSelectedRole: (selectedRole) => {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, selectedRole };
          persist(next);
          return next;
        });
      },

      mergeUser: (patch) => {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          persist(next);
          return next;
        });
      },

      refreshMe: async () => {
        const u = await meApi();
        setUser((prev) => hydrateAndPersist(u, prev));
      },
    };
  }, [user, loading]);

  if (loading) return <>Ładowanie…</>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}