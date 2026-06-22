import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function OnboardingSurvey() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user) return null;

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Moja rola w zespole</h2>
          <p className="card-subtitle">
           Chcesz teraz wykonać krótką ankietę roli zespołowej? Składa się ona z dwóch części. Pierwsza jest oparta na IPIP-BFM-20, czyli krótkim kwestionariuszu samoopisowym dotyczącym ogólnych cech i stylu działania. Druga część została opracowana na potrzeby aplikacji i odnosi się do Twoich preferencji w pracy zespołowej. Na podstawie odpowiedzi zaproponujemy role, które mogą pasować do Twojego sposobu współpracy.
          </p>
        </div>

        <div className="card-body">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-solid" onClick={() => nav("/survey")}>
              Wykonaj teraz
            </button>
            <button className="btn btn-ghost" onClick={() => nav("/dashboard")}>
              Pomiń na później
            </button>
          </div>

          <p style={{ marginTop: 12, color: "var(--muted)", fontWeight: 700 }}>
            Ankietę możesz uruchomić później z poziomu: Profil → „Uruchom ankietę”.
          </p>
        </div>
      </section>
    </div>
  );
}