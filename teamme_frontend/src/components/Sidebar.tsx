import React from "react";
import { NavLink } from "react-router-dom";
import { TeamMeLogo } from "./icons";

const items = [
  { to: "/dashboard", label: "Strona główna" },
  { to: "/tasks", label: "Zadania" },
  { to: "/messages", label: "Skrzynka wiadomości" },
  { to: "/team-search", label: "Szukaj zespołu" },
  { to: "/teams", label: "Moje zespoły" },
  { to: "/history", label: "Historia pracy" },
  { to: "/workspace", label: "Przestrzeń robocza" },
  { to: "/network", label: "Nawiązywanie kontaktów" },
  { to: "/profile", label: "Profil" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <TeamMeLogo />
      </div>

      <nav className="sidebar-nav" aria-label="Menu boczne">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}