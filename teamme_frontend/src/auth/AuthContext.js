import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api";
import { me as meApi } from "../api/auth.api";
const AuthContext = createContext(undefined);
const STORAGE_KEY = "teamme:user";
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const persist = (u) => {
        if (!u)
            localStorage.removeItem(STORAGE_KEY);
        else
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    };
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                setUser(JSON.parse(raw));
            }
            catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);
    const hydrateAndPersist = (incoming, previous) => {
        const merged = {
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
            }
            catch {
                if (mounted) {
                    persist(null);
                    setUser(null);
                }
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
    const value = useMemo(() => {
        return {
            user,
            loading,
            login: async (username, password) => {
                const u = await authApi.login(username, password);
                const existing = localStorage.getItem(STORAGE_KEY);
                let avatarDataUrl;
                if (existing) {
                    try {
                        avatarDataUrl = JSON.parse(existing)?.avatarDataUrl;
                    }
                    catch { }
                }
                const merged = { ...u, avatarDataUrl };
                persist(merged);
                setUser(merged);
                return merged;
            },
            register: async (username, password) => {
                const u = await authApi.register(username, password);
                const merged = { ...u, avatarDataUrl: undefined };
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
                    if (!prev)
                        return prev;
                    const next = { ...prev, avatarDataUrl };
                    persist(next);
                    return next;
                });
            },
            setSelectedRole: (selectedRole) => {
                setUser((prev) => {
                    if (!prev)
                        return prev;
                    const next = { ...prev, selectedRole };
                    persist(next);
                    return next;
                });
            },
            mergeUser: (patch) => {
                setUser((prev) => {
                    if (!prev)
                        return prev;
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
    if (loading)
        return _jsx(_Fragment, { children: "\u0141adowanie\u2026" });
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
