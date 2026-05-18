import React from "react";
import { NavLink } from "react-router-dom";
import { TeamMeLogo } from "./icons";

const items = [
  { to: "/dashboard", label: "Strona główna" },
  { to: "/teams", label: "Moje zespoły" },
  { to: "/team-search", label: "Szukaj zespołu" },
  { to: "/network", label: "Nawiązywanie kontaktów" },
  { to: "/messages", label: "Zaproszenia i zgłoszenia" },
  { to: "/tasks", label: "Moje zadania" },
  { to: "/history", label: "Historia pracy" },
  { to: "/profile", label: "Profil" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-box">
          <div className="sidebar-brand-scale">
            <TeamMeLogo />
          </div>
        </div>
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