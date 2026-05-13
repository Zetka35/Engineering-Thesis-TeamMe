import React from "react";
import { NavLink } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { TeamworkIcon } from "../components/icons";
import { TEAM_ROLES_INFO } from "../data/teamRolesInfo";

const featureCards = [
  {
    title: "Tworzenie zespołów projektowych",
    text: "Buduj zespoły na podstawie celu projektu, wymaganych kompetencji technicznych oraz preferowanego stylu współpracy.",
  },
  {
    title: "Autorskie role zespołowe",
    text: "System wspiera dopasowanie nie tylko do ról technicznych, ale też do sposobu działania w zespole.",
  },
  {
    title: "Rekrutacja i zaproszenia",
    text: "Twórz role projektowe, zapraszaj kandydatów i zarządzaj aplikacjami w jednym środowisku.",
  },
  {
    title: "Historia projektów i ocena współpracy",
    text: "Buduj wiarygodny profil doświadczeń projektowych i rozwijaj jakość współpracy w kolejnych zespołach.",
  },
];

const processSteps = [
  {
    title: "1. Poznaj swój profil zespołowy",
    text: "Użytkownik wypełnia ankietę, która pomaga określić dominujący styl współpracy i rolę zespołową.",
  },
  {
    title: "2. Zbuduj zespół do konkretnego celu",
    text: "Właściciel projektu określa wymagania techniczne, role projektowe i preferowany profil współpracy.",
  },
  {
    title: "3. Dobierz ludzi bardziej świadomie",
    text: "System wspiera decyzję poprzez połączenie kompetencji technicznych i dopasowania zespołowego.",
  },
  {
    title: "4. Zamknij projekt i oceń współpracę",
    text: "Po zakończeniu projektu członkowie zespołu mogą wystawić oceny współpracy i rozbudować historię pracy.",
  },
];

export default function Home() {
  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="public-content">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-badge">Aplikacja wspierająca tworzenie zespołów projektowych</span>

            <h1 className="landing-title">
              Twórz zespoły na podstawie kompetencji technicznych i jakości współpracy.
            </h1>

            <p className="landing-lead">
              TeamMe pomaga budować zespoły projektowe - łączy informacje o umiejętnościach technicznych, 
              doświadczeniu oraz autorskich rolach zespołowych, aby wspierać skuteczne 
              dopasowanie ludzi do projektów 
              i do siebie nawzajem.
            </p>

            <div className="landing-actions">
              <NavLink to="/register" className="btn btn-solid">
                Załóż konto
              </NavLink>
              <NavLink to="/login" className="btn btn-ghost landing-outline-btn">
                Zaloguj się
              </NavLink>
            </div>

            <div className="landing-mini-stats">
              <div className="landing-stat">
                <div className="landing-stat-value">7</div>
                <div className="landing-stat-label">autorskich ról zespołowych</div>
              </div>
              <div className="landing-stat">
                <div className="landing-stat-value">2</div>
                <div className="landing-stat-label">wymiary dopasowania: techniczne i zespołowe</div>
              </div>
              <div className="landing-stat">
                <div className="landing-stat-value">1</div>
                <div className="landing-stat-label">spójny proces od rekrutacji do historii projektu</div>
              </div>
            </div>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-hero-visual-box">
              <TeamworkIcon />
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="landing-section-header">
            <h2>Co oferuje TeamMe?</h2>
            <p>
              System wspiera nie tylko tworzenie zespołów, ale też zarządzanie całym cyklem pracy projektowej.
            </p>
          </div>

          <div className="landing-features-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="landing-feature-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section">
          <div className="landing-section-header">
            <h2>Jak działa system?</h2>
            <p>
              Główną ideą narzędzia jest połączenie informacji o kompetencjach technicznych z profilem współpracy zespołowej.
            </p>
          </div>

          <div className="landing-steps-grid">
            {processSteps.map((step) => (
              <article key={step.title} className="landing-step-card">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="roles" className="landing-section">
          <div className="landing-section-header">
            <h2>Autorskie role zespołowe</h2>
            <p>
              Role zespołowe w TeamMe nie zastępują ról technicznych. Stanowią drugi wymiar opisu użytkownika:
              pokazują, jak dana osoba najczęściej działa we współpracy z innymi.
            </p>
          </div>

          <div className="landing-method-box">
            <h3>Jak interpretować role w systemie?</h3>
            <p>
              W TeamMe użytkownik może pasować do projektu z dwóch perspektyw:
              <b> kompetencyjnej</b> oraz <b>zespołowej</b>.
              Rola projektowa odpowiada na pytanie: <i>co ktoś potrafi zrobić</i>,
              a rola zespołowa odpowiada na pytanie: <i>jak dana osoba najczęściej współpracuje</i>.
            </p>
          </div>

          <div className="landing-roles-grid">
            {TEAM_ROLES_INFO.map((role) => (
              <article key={role.name} className="landing-role-card">
                <h3>{role.name}</h3>
                <p className="landing-role-lead">{role.shortDescription}</p>

                <div className="landing-role-block">
                  <div className="landing-role-label">Styl współpracy</div>
                  <p>{role.collaborationStyle}</p>
                </div>

                <div className="landing-role-block">
                  <div className="landing-role-label">Mocne strony</div>
                  <ul>
                    {role.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className="landing-role-block">
                  <div className="landing-role-label">Gdzie dobrze się sprawdza?</div>
                  <ul>
                    {role.goodFitExamples.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="landing-section">
          <div className="landing-section-header">
            <h2>Dlaczego to podejście ma znaczenie?</h2>
            <p>
              W wielu projektach problemem nie jest wyłącznie brak kompetencji, ale także niedopasowanie sposobu współpracy.
              TeamMe został zaprojektowany po to, aby wspierać budowanie zespołów, które są jednocześnie
              kompetentne i zdolne do skutecznego działania jako całość.
            </p>
          </div>

          <div className="landing-about-box">
            <p>
              Narzędzie pomaga użytkownikom tworzyć profile, budować zespoły do konkretnych projektów,
              rekrutować kandydatów, rozwijać historię pracy projektowej oraz oceniać jakość współpracy po zakończeniu projektu.
            </p>
          </div>
        </section>

        <section id="contact" className="landing-section">
          <div className="landing-section-header">
            <h2>Rozpocznij korzystanie z TeamMe</h2>
            <p>
              Załóż konto, wypełnij ankietę i zbuduj zespół dopasowany zarówno do zadań projektowych, jak i do jakości współpracy.
            </p>
          </div>

          <div className="landing-cta-box">
            <NavLink to="/register" className="btn btn-solid">
              Załóż konto
            </NavLink>
            <NavLink to="/login" className="btn btn-ghost landing-outline-btn">
              Mam już konto
            </NavLink>
          </div>
        </section>
      </main>
    </div>
  );
}