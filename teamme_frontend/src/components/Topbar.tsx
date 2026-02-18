import React from "react";

interface TopbarProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export default function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {user ? <span>Witaj, {user.username}!</span> : <span>Witaj!</span>}
      </div>

      <div className="topbar-center">
        <input
          type="text"
          placeholder="Szukaj..."
          className="topbar-search"
        />
      </div>

      <div className="topbar-right"> <span>⚙️</span> <span>MOJE KONTO</span> </div>
    </header>
  );
}

