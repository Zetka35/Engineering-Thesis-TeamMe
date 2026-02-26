import React from "react";
import { Link, NavLink } from "react-router-dom";
import { TeamMeLogo } from "./icons";

export default function PublicNavbar() {
  return (
    <header className="public-topbar">
      <div className="public-topbar-inner">
        <Link to="/" className="public-brand">
          <TeamMeLogo />
        </Link>

        <nav className="public-nav" aria-label="Nawigacja">
          <a className="public-link" href="#onas">O NAS</a>
          <a className="public-link" href="#kontakt">KONTAKT</a>
          <a className="public-link" href="#role">ROLE ZESPOŁOWE</a>
        </nav>

        <div className="public-actions">
          <NavLink to="/register" className="btn btn-ghost">
            Dołącz teraz
          </NavLink>
          <NavLink to="/login" className="btn btn-solid">
            Zaloguj się
          </NavLink>
        </div>
      </div>
    </header>
  );
}