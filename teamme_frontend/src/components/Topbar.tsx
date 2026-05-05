import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GearIcon, GridIcon, IconButton, SearchIcon } from "./icons";

type QuickLink = {
  label: string;
  to: string;
  keywords: string[];
};

const QUICK_LINKS: QuickLink[] = [
  { label: "Strona główna", to: "/dashboard", keywords: ["dashboard", "główna", "home"] },
  { label: "Zadania", to: "/tasks", keywords: ["zadania", "taski", "tasks"] },
  { label: "Skrzynka wiadomości", to: "/messages", keywords: ["wiadomości", "messages", "zaproszenia", "aplikacje"] },
  { label: "Szukaj zespołu", to: "/team-search", keywords: ["szukaj", "zespoły", "rekrutacja"] },
  { label: "Nawiązywanie kontaktów", to: "/network", keywords: ["network", "kontakty", "ludzie"] },
  { label: "Moje zespoły", to: "/teams", keywords: ["zespoły", "projekty", "team"] },
  { label: "Historia pracy", to: "/history", keywords: ["historia", "projekty zakończone"] },
  { label: "Profil", to: "/profile", keywords: ["profil", "konto"] },
  { label: "Ankieta ról zespołowych", to: "/survey", keywords: ["ankieta", "role", "survey"] },
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

export default function Topbar() {
  const { user, logout, updateAvatar } = useAuth();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeAvatarTimer = useRef<number | null>(null);

  useOutsideClick(searchRef, () => setSearchOpen(false));
  useOutsideClick(settingsRef, () => setSettingsOpen(false));
  useOutsideClick(appsRef, () => setAppsOpen(false));
  useOutsideClick(avatarRef, () => setAvatarOpen(false));

  const initials = useMemo(() => {
    const u = user?.username ?? "";
    return u.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  const avatarStyle = useMemo(() => {
    if (!user?.avatarDataUrl) return undefined;
    return { backgroundImage: `url(${user.avatarDataUrl})` } as React.CSSProperties;
  }, [user?.avatarDataUrl]);

  const filteredLinks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return QUICK_LINKS;

    return QUICK_LINKS.filter((item) => {
      const haystack = [item.label, ...item.keywords].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [q]);

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
    setSettingsOpen(false);
    setAppsOpen(false);
    setAvatarOpen(false);
    nav(to);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!q.trim()) {
      navigateAndClose("/team-search");
      return;
    }

    if (filteredLinks.length > 0) {
      navigateAndClose(filteredLinks[0].to);
      return;
    }

    navigateAndClose("/team-search");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="dropdown" ref={searchRef} style={{ width: "100%", maxWidth: 420 }}>
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <span className="topbar-search-icon">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Szukaj modułów..."
              aria-label="Szukaj modułów"
            />
          </form>

          {searchOpen && (
            <div className="dropdown-menu" role="menu" aria-label="Szybkie przejścia">
              {filteredLinks.length > 0 ? (
                filteredLinks.slice(0, 6).map((item) => (
                  <button
                    key={item.to}
                    className="menu-item"
                    type="button"
                    onClick={() => navigateAndClose(item.to)}
                  >
                    {item.label}
                  </button>
                ))
              ) : (
                <div className="menu-item" style={{ cursor: "default" }}>
                  Brak dopasowań. Naciśnij Enter, aby przejść do wyszukiwania zespołów.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="dropdown" ref={settingsRef}>
          <IconButton
            title="Ustawienia"
            onClick={() => {
              setSettingsOpen((v) => !v);
              setAppsOpen(false);
              setAvatarOpen(false);
            }}
          >
            <GearIcon />
          </IconButton>

          {settingsOpen && (
            <div className="dropdown-menu" role="menu" aria-label="Ustawienia">
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/profile")}>
                Profil i konto
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/survey")}>
                Ankieta ról zespołowych
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/history")}>
                Historia pracy
              </button>
            </div>
          )}
        </div>

        <div className="dropdown" ref={appsRef}>
          <IconButton
            title="Aplikacje"
            onClick={() => {
              setAppsOpen((v) => !v);
              setSettingsOpen(false);
              setAvatarOpen(false);
            }}
          >
            <GridIcon />
          </IconButton>

          {appsOpen && (
            <div className="dropdown-menu" role="menu" aria-label="Aplikacje">
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/dashboard")}>
                Strona główna
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/teams")}>
                Moje zespoły
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/tasks")}>
                Zadania
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/messages")}>
                Skrzynka wiadomości
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/team-search")}>
                Szukaj zespołu
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/network")}>
                Nawiązywanie kontaktów
              </button>
              <button className="menu-item" type="button" onClick={() => navigateAndClose("/history")}>
                Historia pracy
              </button>
            </div>
          )}
        </div>

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
            onClick={() => {
              setAvatarOpen((v) => !v);
              setSettingsOpen(false);
              setAppsOpen(false);
            }}
            role="button"
            tabIndex={0}
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

              <button className="menu-item" type="button" onClick={() => navigateAndClose("/profile")}>
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