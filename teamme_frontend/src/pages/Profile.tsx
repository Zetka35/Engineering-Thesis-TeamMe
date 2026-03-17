import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { SurveyResult } from "../survey/miniIpip";
import { fetchMySurvey } from "../api/survey.api";
import { updateMyProfile } from "../api/user.api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border, #d7e1e8)",
  background: "white",
  font: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};

export default function Profile() {
  const { user, mergeUser } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  const username = user.username;

  const [survey, setSurvey] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  useEffect(() => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setBio(user.bio ?? "");
  }, [user.firstName, user.lastName, user.bio]);

  useEffect(() => {
    setLoading(true);
    fetchMySurvey(username)
      .then(setSurvey)
      .catch(() => setSurvey(null))
      .finally(() => setLoading(false));
  }, [username]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateMyProfile({
        firstName,
        lastName,
        bio,
      });

      mergeUser({
        firstName: updated.firstName ?? null,
        lastName: updated.lastName ?? null,
        bio: updated.bio ?? null,
      });

      setSuccessMsg("Profil został zapisany.");
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zapisać profilu.");
    } finally {
      setSaving(false);
    }
  }

  const hasSelectedRole = !!user.selectedRole;
  const hasSurvey = !!survey;

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Profil</h2>
          <p className="card-subtitle">Ankieta „Moja rola w zespole”.</p>
        </div>

        <div className="card-body">
          {error && <div className="alert">{error}</div>}
          {successMsg && (
            <div
              className="alert"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <b>Użytkownik:</b> {username}
            </div>

            <div className="profile-block">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div className="profile-block-title">Dane podstawowe</div>

                {!editing ? (
                  <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                    Edytuj profil
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn btn-solid" onClick={saveProfile} disabled={saving}>
                      {saving ? "Zapisywanie…" : "Zapisz"}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditing(false);
                        setFirstName(user.firstName ?? "");
                        setLastName(user.lastName ?? "");
                        setBio(user.bio ?? "");
                        setError("");
                        setSuccessMsg("");
                      }}
                    >
                      Anuluj
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label><b>Imię</b></label>
                    <input
                      style={inputStyle}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <label><b>Nazwisko</b></label>
                    <input
                      style={inputStyle}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <label><b>Opis</b></label>
                    <textarea
                      style={textareaStyle}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={1000}
                      placeholder="Napisz kilka zdań o sobie, swoich zainteresowaniach, mocnych stronach lub preferowanej roli w zespole."
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  <div><b>Imię:</b> {user.firstName || "—"}</div>
                  <div><b>Nazwisko:</b> {user.lastName || "—"}</div>
                  <div>
                    <b>Opis:</b>{" "}
                    {user.bio ? (
                      <span className="muted" style={{ whiteSpace: "pre-wrap" }}>{user.bio}</span>
                    ) : (
                      <span className="muted">Brak opisu.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-block">
              <div className="profile-block-title">Wybrana rola</div>

              {hasSelectedRole ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="pill">{user.selectedRole}</span>
                  <span className="muted" style={{ fontWeight: 700 }}>
                    To jest rola zapisana na Twoim profilu.
                  </span>
                </div>
              ) : (
                <div className="muted" style={{ fontWeight: 800 }}>
                  Nie wybrano jeszcze roli.
                </div>
              )}
            </div>

            <div className="profile-block">
              <div className="profile-block-title">Moja rola w zespole (ankieta)</div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button className="btn btn-solid" onClick={() => nav("/survey")}>
                  {hasSurvey ? "Powtórz ankietę" : "Uruchom ankietę"}
                </button>

                {loading ? (
                  <span className="muted" style={{ fontWeight: 800 }}>Sprawdzam status…</span>
                ) : hasSurvey ? (
                  <span className="muted" style={{ fontWeight: 800 }}>
                    Ankieta wykonana: {new Date(survey!.completedAt).toLocaleString("pl-PL")}
                  </span>
                ) : hasSelectedRole ? (
                  <span className="muted" style={{ fontWeight: 800 }}>
                    Rola jest już zapisana na profilu.
                  </span>
                ) : (
                  <span className="muted" style={{ fontWeight: 800 }}>
                    Ankieta jeszcze niewykonana.
                  </span>
                )}
              </div>

              {hasSurvey && (
                <div style={{ marginTop: 10 }}>
                  <b>Top 3 (ostatni wynik):</b>{" "}
                  {survey!.topRoles
                    .map((x) => `${x.key} (${Math.max(0, Math.min(1, x.score)).toFixed(3)})`)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}