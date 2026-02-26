import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { DotsIcon, GearIcon, GridIcon, IconButton, SearchIcon } from "./icons";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");

  const initials = useMemo(() => {
    const u = user?.username ?? "";
    return u.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-search">
          <span className="topbar-search-icon"><SearchIcon /></span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj..."
            aria-label="Szukaj"
          />
        </div>
      </div>

      <div className="topbar-right">
        <IconButton title="Ustawienia">
          <GearIcon />
        </IconButton>
        <IconButton title="Aplikacje">
          <GridIcon />
        </IconButton>

        <div className="account">
          <div className="account-label">
            <span className="account-title">MOJE KONTO</span>
          </div>

          <div className="avatar" aria-label="Konto">
            {initials || "U"}
          </div>

          <div className="account-menu">
            <button className="menu-item" type="button" onClick={logout}>
              Wyloguj
            </button>
          </div>

          <span className="account-dots" aria-hidden="true">
            <DotsIcon />
          </span>
        </div>
      </div>
    </header>
  );
}