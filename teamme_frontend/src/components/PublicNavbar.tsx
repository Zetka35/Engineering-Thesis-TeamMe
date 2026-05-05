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

        <nav className="public-nav" aria-label="Nawigacja publiczna">
          <a className="public-link" href="#features">FUNKCJE</a>
          <a className="public-link" href="#how-it-works">JAK TO DZIAŁA</a>
          <a className="public-link" href="#roles">ROLE ZESPOŁOWE</a>
          <a className="public-link" href="#about">O SYSTEMIE</a>
          <a className="public-link" href="#contact">START</a>
        </nav>

        <div className="public-actions">
          <NavLink to="/register" className="btn btn-ghost public-ghost-btn">
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