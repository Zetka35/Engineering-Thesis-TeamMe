import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { SurveyResult } from "../survey/miniIpip";
import { fetchMySurvey } from "../api/survey.api";

export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  const username = user.username;

  const [survey, setSurvey] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMySurvey(username)
      .then(setSurvey)
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Profil</h2>
          <p className="card-subtitle">Ankieta „Moja rola w zespole”.</p>
        </div>

        <div className="card-body">
          <div style={{ display: "grid", gap: 12 }}>
            <div><b>Użytkownik:</b> {username}</div>

            <div className="profile-block">
              <div className="profile-block-title">Moja rola w zespole (ankieta)</div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button className="btn btn-solid" onClick={() => nav("/survey")}>
                  Uruchom / powtórz ankietę
                </button>

                {loading ? (
                  <span className="muted" style={{ fontWeight: 800 }}>Sprawdzam status…</span>
                ) : survey ? (
                  <span className="muted" style={{ fontWeight: 800 }}>
                    Ankieta wykonana: {new Date(survey.completedAt).toLocaleString("pl-PL")}
                  </span>
                ) : (
                  <span className="muted" style={{ fontWeight: 800 }}>
                    Ankieta jeszcze niewykonana.
                  </span>
                )}
              </div>

              {survey && (
                <div style={{ marginTop: 10 }}>
                  <b>Top 3 (ostatni wynik):</b>{" "}
                  {survey.topRoles.map((x) => `${x.key} (${Math.max(0, Math.min(1, x.score)).toFixed(3)})`).join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}