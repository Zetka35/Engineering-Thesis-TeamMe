import React from "react";
import PublicNavbar from "../components/PublicNavbar";
import { TeamworkIcon } from "../components/icons";

export default function Home() {
  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="public-content">
        <section className="hero">
          <div className="hero-icon" aria-hidden="true">
            <TeamworkIcon />
          </div>

          <div className="hero-text">
            <h1>Dlaczego potrzebujesz TeamMe?</h1>
            <p className="hero-lead">Informacje o funkcjach strony</p>

            <div className="hero-grid">
              <div className="hero-box">
                <h3>Jak działa TEAMWORK?</h3>
                <a className="hero-link" href="#role">
                  Krótkie wyjaśnienie ogólnych zasad pracy grupowej i ról zespołowych
                </a>
              </div>

              <div className="hero-box">
                <h3>Jak działa nasza strona?</h3>
                <a className="hero-link" href="#onas">
                  O tym jak strona może pomóc w tworzeniu i zarządzaniu zespołem
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="onas" className="public-section">
          <h2>O nas</h2>
          <p>
            TeamMe to narzędzie wspierające proces tworzenia ról zespołowych i organizację pracy w zespole.
            (Opisu systemu).
          </p>
        </section>

        <section id="role" className="public-section">
          <h2>Role zespołowe</h2>
          <p>
            Miejsce na opis ról i logikę dopasowania ról do członków zespołu.
          </p>
        </section>

        <section id="kontakt" className="public-section">
          <h2>Kontakt</h2>
          <p>Dodaj dane kontaktowe albo formularz (na razie placeholder).</p>
        </section>
      </main>
    </div>
  );
}