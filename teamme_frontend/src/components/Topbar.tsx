import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GearIcon, GridIcon, IconButton, SearchIcon } from "./icons";

function useOutsideClick(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
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
  // proste zabezpieczenie – limit 2MB
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

  // dropdowny
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const closeAvatarTimer = useRef<number | null>(null);

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
  }, 350); // <- czas zamknięcia (ms). Zwiększ np. do 600
}

  function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void
) {
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}

  useOutsideClick(settingsRef, () => setSettingsOpen(false));
  useOutsideClick(appsRef, () => setAppsOpen(false));
  useOutsideClick(avatarRef, () => setAvatarOpen(false));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = useMemo(() => {
    const u = user?.username ?? "";
    return u.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  const avatarStyle = useMemo(() => {
    if (!user?.avatarDataUrl) return undefined;
    return { backgroundImage: `url(${user.avatarDataUrl})` } as React.CSSProperties;
  }, [user?.avatarDataUrl]);

  function handleLogout() {
    logout();
    nav("/login");
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
      // pozwala wybrać ten sam plik ponownie
      e.target.value = "";
    }
  }

  function triggerAvatarUpload() {
    fileInputRef.current?.click();
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-search">
          <span className="topbar-search-icon">
            <SearchIcon />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj..."
            aria-label="Szukaj"
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Ustawienia */}
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
              <button className="menu-item" type="button" onClick={() => alert("Profil – w przygotowaniu")}>
                Profil i konto
              </button>
              <button className="menu-item" type="button" onClick={() => alert("Preferencje – w przygotowaniu")}>
                Preferencje (język / motyw)
              </button>
              <button className="menu-item" type="button" onClick={() => alert("Powiadomienia – w przygotowaniu")}>
                Powiadomienia
              </button> 
            </div>
          )}
        </div>

        {/* Aplikacje */}
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
              <button className="menu-item" type="button" onClick={() => nav("/teams")}>
                Moje zespoły
              </button>
              <button className="menu-item" type="button" onClick={() => nav("/tasks")}>
                Zadania
              </button>
              <button className="menu-item" type="button" onClick={() => nav("/messages")}>
                Wiadomości
              </button>
              <button className="menu-item" type="button" onClick={() => nav("/workspace")}>
                Przestrzeń robocza
              </button>
            </div>
          )}
        </div>

        {/* Avatar (menu na hover i click) */}
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

          {/* ukryty input do uploadu */}
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