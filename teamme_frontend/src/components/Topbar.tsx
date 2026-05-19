import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTeams, searchTeams } from "../api/teams.api";
import { getNetworkUsers, type NetworkUser } from "../api/user.api";
import { useAuth } from "../auth/AuthContext";
import type { TeamSummary } from "../models/Team";
import { SearchIcon } from "./icons";

type QuickLink = {
  label: string;
  to: string;
  keywords: string[];
  description: string;
};

type SearchResult = {
  id: string;
  category: "Funkcje" | "Osoby" | "Zespoły";
  label: string;
  description: string;
  to: string;
  keywords: string[];
};

const QUICK_LINKS: QuickLink[] = [
  {
    label: "Strona główna",
    to: "/dashboard",
    description: "Przejdź do panelu startowego.",
    keywords: ["dashboard", "główna", "home", "start", "panel"],
  },
  {
    label: "Moje zespoły",
    to: "/teams",
    description: "Zarządzaj swoimi projektami i zespołami.",
    keywords: ["zespoły", "projekty", "team", "moje zespoły"],
  },
  {
    label: "Szukaj zespołu",
    to: "/team-search",
    description: "Znajdź otwarte projekty i rekrutacje.",
    keywords: ["szukaj", "zespoły", "rekrutacja", "projekt"],
  },
  {
    label: "Nawiązywanie kontaktów",
    to: "/network",
    description: "Przeglądaj profile innych użytkowników.",
    keywords: ["network", "kontakty", "ludzie", "osoby", "użytkownicy"],
  },
  {
    label: "Zaproszenia i zgłoszenia",
    to: "/messages",
    description: "Sprawdź aplikacje do zespołów i zaproszenia.",
    keywords: ["wiadomości", "zaproszenia", "zgłoszenia", "aplikacje", "requests"],
  },
  {
    label: "Moje zadania",
    to: "/tasks",
    description: "Zobacz zadania przypisane do Ciebie.",
    keywords: ["zadania", "taski", "tasks", "todo"],
  },
  {
    label: "Historia pracy",
    to: "/history",
    description: "Zobacz zakończone projekty i oceny wkładu.",
    keywords: ["historia", "projekty zakończone", "oceny", "review"],
  },
  {
    label: "Profil",
    to: "/profile",
    description: "Edytuj swój profil, umiejętności i doświadczenie.",
    keywords: ["profil", "konto", "ustawienia", "skills"],
  },
  {
    label: "Ankieta ról zespołowych",
    to: "/survey",
    description: "Uzupełnij lub sprawdź wynik ankiety ról zespołowych.",
    keywords: ["ankieta", "role", "survey", "rola zespołowa"],
  },
];

function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void
) {
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Plik jest za duży. Maksymalnie 2MB.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Wybierz plik graficzny (png/jpg/webp).");
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(result: SearchResult, query: string) {
  const needle = normalizeText(query.trim());

  if (!needle) return true;

  const haystack = normalizeText(
    [
      result.label,
      result.description,
      result.category,
      ...result.keywords,
    ].join(" ")
  );

  return haystack.includes(needle);
}

function userDisplayName(user: NetworkUser) {
  return user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
}

function userKeywords(user: NetworkUser) {
  return [
    user.username,
    user.fullName,
    user.firstName,
    user.lastName,
    user.headline,
    user.selectedRole,
    user.location,
    ...(user.topSkills ?? []).map((skill) => skill.name),
    ...(user.languages ?? []).map((language) => language.name),
  ].filter(Boolean) as string[];
}

function teamKeywords(team: TeamSummary) {
  return [
    team.name,
    team.description,
    team.projectArea,
    team.experienceLevel,
    team.recruitmentStatus,
    team.myRole,
    team.expectedTimeText,
  ].filter(Boolean) as string[];
}

export default function Topbar() {
  const { user, logout, updateAvatar } = useAuth();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDataLoaded, setSearchDataLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [myTeams, setMyTeams] = useState<TeamSummary[]>([]);
  const [openTeams, setOpenTeams] = useState<TeamSummary[]>([]);

  const [avatarOpen, setAvatarOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeAvatarTimer = useRef<number | null>(null);

  useOutsideClick(searchRef, () => setSearchOpen(false));
  useOutsideClick(avatarRef, () => setAvatarOpen(false));

  const initials = useMemo(() => {
    const u = user?.username ?? "";
    return u.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  const avatarStyle = useMemo(() => {
    if (!user?.avatarDataUrl) return undefined;
    return { backgroundImage: `url(${user.avatarDataUrl})` } as React.CSSProperties;
  }, [user?.avatarDataUrl]);

  async function ensureSearchDataLoaded() {
    if (searchDataLoaded || searchLoading) return;

    setSearchLoading(true);
    setSearchError("");

    try {
      const [usersResult, myTeamsResult, openTeamsResult] = await Promise.all([
        getNetworkUsers(),
        fetchTeams(),
        searchTeams(),
      ]);

      setNetworkUsers(usersResult ?? []);
      setMyTeams(myTeamsResult ?? []);
      setOpenTeams(openTeamsResult ?? []);
      setSearchDataLoaded(true);
    } catch {
      setSearchError("Nie udało się załadować pełnych wyników wyszukiwania.");
    } finally {
      setSearchLoading(false);
    }
  }

  const functionResults = useMemo<SearchResult[]>(() => {
    return QUICK_LINKS.map((link) => ({
      id: `function-${link.to}`,
      category: "Funkcje",
      label: link.label,
      description: link.description,
      to: link.to,
      keywords: link.keywords,
    }));
  }, []);

  const userResults = useMemo<SearchResult[]>(() => {
    return networkUsers.map((networkUser) => ({
      id: `user-${networkUser.username}`,
      category: "Osoby",
      label: userDisplayName(networkUser),
      description: [
        `@${networkUser.username}`,
        networkUser.selectedRole,
        networkUser.headline,
        networkUser.location,
      ]
        .filter(Boolean)
        .join(" · "),
      to: `/network/${encodeURIComponent(networkUser.username)}`,
      keywords: userKeywords(networkUser),
    }));
  }, [networkUsers]);

  const teamResults = useMemo<SearchResult[]>(() => {
    const resultsById = new Map<number, SearchResult>();

    for (const team of myTeams) {
      resultsById.set(team.id, {
        id: `team-own-${team.id}`,
        category: "Zespoły",
        label: team.name,
        description: [
          "Mój zespół",
          team.projectArea,
          team.recruitmentStatus,
          team.description,
        ]
          .filter(Boolean)
          .join(" · "),
        to: `/teams/${team.id}`,
        keywords: teamKeywords(team),
      });
    }

    for (const team of openTeams) {
      if (resultsById.has(team.id)) continue;

      resultsById.set(team.id, {
        id: `team-open-${team.id}`,
        category: "Zespoły",
        label: team.name,
        description: [
          "Otwarty zespół",
          team.projectArea,
          team.recruitmentStatus,
          team.description,
        ]
          .filter(Boolean)
          .join(" · "),
        to: `/teams/public/${team.id}`,
        keywords: teamKeywords(team),
      });
    }

    return Array.from(resultsById.values());
  }, [myTeams, openTeams]);

  const groupedResults = useMemo(() => {
    const needle = q.trim();
    const minQueryForDynamicResults = needle.length >= 2;

    const functions = functionResults
      .filter((result) => matchesQuery(result, needle))
      .slice(0, 5);

    const users = minQueryForDynamicResults
      ? userResults.filter((result) => matchesQuery(result, needle)).slice(0, 5)
      : [];

    const teams = minQueryForDynamicResults
      ? teamResults.filter((result) => matchesQuery(result, needle)).slice(0, 5)
      : [];

    return {
      functions,
      users,
      teams,
      all: [...functions, ...users, ...teams],
    };
  }, [q, functionResults, userResults, teamResults]);

  function openAvatarMenu() {
    if (closeAvatarTimer.current) {
      window.clearTimeout(closeAvatarTimer.current);
      closeAvatarTimer.current = null;
    }

    setAvatarOpen(true);
  }

  function scheduleCloseAvatarMenu() {
    if (closeAvatarTimer.current) window.clearTimeout(closeAvatarTimer.current);

    closeAvatarTimer.current = window.setTimeout(() => {
      setAvatarOpen(false);
      closeAvatarTimer.current = null;
    }, 300);
  }

  function handleLogout() {
    logout();
    nav("/login");
  }

  function triggerAvatarUpload() {
    fileInputRef.current?.click();
  }

  async function onAvatarFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const dataUrl = await fileToDataUrl(file);
      updateAvatar(dataUrl);
      setAvatarOpen(false);
    } catch (err: any) {
      alert(err?.message ?? "Nie udało się ustawić zdjęcia.");
    } finally {
      e.target.value = "";
    }
  }

  function navigateAndClose(to: string) {
    setSearchOpen(false);
    setAvatarOpen(false);
    setQ("");
    nav(to);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (groupedResults.all.length > 0) {
      navigateAndClose(groupedResults.all[0].to);
      return;
    }

    navigateAndClose("/team-search");
  }

  function renderResult(result: SearchResult) {
    return (
      <button
        key={result.id}
        className="global-search-result"
        type="button"
        onClick={() => navigateAndClose(result.to)}
      >
        <span className="global-search-result-main">{result.label}</span>
        <span className="global-search-result-sub">{result.description}</span>
      </button>
    );
  }

  function renderGroup(label: string, results: SearchResult[]) {
    if (results.length === 0) return null;

    return (
      <div className="global-search-group" key={label}>
        <div className="global-search-group-title">{label}</div>
        <div className="global-search-group-list">{results.map(renderResult)}</div>
      </div>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="global-search-wrap" ref={searchRef}>
          <form className="topbar-search global-search-form" onSubmit={handleSearchSubmit}>
            <span className="topbar-search-icon">
              <SearchIcon />
            </span>

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
                void ensureSearchDataLoaded();
              }}
              onFocus={() => {
                setSearchOpen(true);
                void ensureSearchDataLoaded();
              }}
              placeholder="Szukaj..."
              aria-label="Szukaj..."
            />
          </form>

          {searchOpen && (
            <div className="global-search-menu" role="menu" aria-label="Globalne wyszukiwanie">
              {searchLoading && (
                <div className="global-search-empty">Ładowanie wyników…</div>
              )}

              {searchError && (
                <div className="global-search-empty global-search-error">
                  {searchError}
                </div>
              )}

              {!searchLoading && !searchError && (
                <>
                  {renderGroup("Funkcje", groupedResults.functions)}
                  {renderGroup("Osoby", groupedResults.users)}
                  {renderGroup("Zespoły", groupedResults.teams)}

                  {q.trim().length > 0 && groupedResults.all.length === 0 && (
                    <div className="global-search-empty">
                      Brak dopasowań. Naciśnij Enter, aby przejść do wyszukiwania zespołów.
                    </div>
                  )}

                  {q.trim().length > 0 && q.trim().length < 2 && (
                    <div className="global-search-hint">
                      Wpisz co najmniej 2 znaki, aby wyszukać osoby i zespoły.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right topbar-right-avatar-only">
        <div
          className="avatar-wrap"
          ref={avatarRef}
          onMouseEnter={openAvatarMenu}
          onMouseLeave={scheduleCloseAvatarMenu}
        >
          <div
            className={`avatar ${user?.avatarDataUrl ? "has-photo" : ""}`}
            style={avatarStyle}
            title={user?.username ? `Zalogowano: ${user.username}` : "Konto"}
            onClick={() => setAvatarOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setAvatarOpen((v) => !v);
              }
            }}
          >
            {!user?.avatarDataUrl && initials}
          </div>

          {avatarOpen && (
            <div
              className="dropdown-menu avatar-menu"
              role="menu"
              aria-label="Konto"
              onMouseEnter={openAvatarMenu}
              onMouseLeave={scheduleCloseAvatarMenu}
            >
              <div className="menu-header">
                <div className="menu-title">{user?.username ?? "Użytkownik"}</div>
                <div className="menu-sub">Zarządzanie profilem</div>
              </div>

              <button
                className="menu-item"
                type="button"
                onClick={() => navigateAndClose("/profile")}
              >
                Otwórz profil
              </button>

              <button className="menu-item" type="button" onClick={triggerAvatarUpload}>
                Zmień zdjęcie profilowe
              </button>

              <button className="menu-item" type="button" onClick={() => updateAvatar(undefined)}>
                Usuń zdjęcie
              </button>

              <div className="menu-sep" />

              <button className="menu-item danger" type="button" onClick={handleLogout}>
                Wyloguj
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={onAvatarFilePicked}
          />
        </div>
      </div>
    </header>
  );
}