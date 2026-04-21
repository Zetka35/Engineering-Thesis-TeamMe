import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TeamPublicDetails } from "../models/Team";
import { applyToTeam, fetchPublicTeam } from "../api/teams.api";
import { extractApiMessage } from "../api/http";

function recruitmentLabel(value?: string | null) {
  switch (value) {
    case "OPEN":
      return "rekrutacja otwarta";
    case "PAUSED":
      return "rekrutacja wstrzymana";
    case "CLOSED":
      return "rekrutacja zamknięta";
    case "FULL":
      return "komplet";
    default:
      return value || "brak";
  }
}

function experienceLabel(value?: string | null) {
  switch (value) {
    case "BEGINNER":
      return "początkujący";
    case "JUNIOR":
      return "junior";
    case "MID":
      return "mid";
    case "SENIOR":
      return "senior";
    case "MIXED":
      return "mieszany";
    default:
      return value || "nie podano";
  }
}

export default function PublicTeamDetails() {
  const nav = useNavigate();
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);

  const [team, setTeam] = useState<TeamPublicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingApply, setSavingApply] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [targetRoleName, setTargetRoleName] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!Number.isFinite(numericTeamId)) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchPublicTeam(numericTeamId);
      setTeam(data);
    } catch (e: unknown) {
      setError(extractApiMessage(e));
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [numericTeamId]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingApply(true);
    setError("");
    setSuccessMsg("");

    try {
      await applyToTeam(team.id, {
        targetRoleName: targetRoleName || null,
        message,
      });

      setSuccessMsg(
        "Aplikacja do zespołu została wysłana. Gdy właściciel zespołu podejmie decyzję, jej status pojawi się w Twoich aplikacjach i zaproszeniach."
      );
      setTargetRoleName("");
      setMessage("");
    } catch (e: unknown) {
      setError(
        `Nie udało się wysłać aplikacji do zespołu. ${extractApiMessage(e)}`
      );
    } finally {
      setSavingApply(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie publicznego widoku zespołu…</div>
        </section>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">
            {error || "Nie udało się załadować zespołu."}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">{team.name}</h2>
          <p className="card-subtitle">Publiczny widok zespołu dla kandydatów</p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}
          {successMsg && (
            <div
              className="alert"
              style={{
                background: "#ecfdf3",
                color: "#166534",
                borderColor: "#bbf7d0",
              }}
            >
              {successMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => nav("/team-search")}>
              ← Wróć do wyszukiwania
            </button>
          </div>

          <div className="profile-block" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="pill">owner: {team.ownerUsername || "—"}</span>
              <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
              <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
              <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
              <span className="pill">
                członkowie: {team.memberCount}/{team.maxMembers}
              </span>
              <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
            </div>

            <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
              {team.description || "Brak opisu projektu."}
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Technologie projektu</div>
            {team.technologies.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {team.technologies.map((technology) => (
                  <span key={technology.id} className="pill">
                    {technology.name}
                    {technology.requiredLevel ? ` • ${technology.requiredLevel}/5` : ""}
                    {technology.required ? " • wymagana" : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted">Brak określonych technologii.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Poszukiwane role</div>

            {team.roleRequirements.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {team.roleRequirements.map((roleRequirement) => (
                  <div
                    key={roleRequirement.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <b>{roleRequirement.projectRoleName}</b>
                      <span className="pill">miejsca: {roleRequirement.slots}</span>
                      <span className="pill">priorytet: {roleRequirement.priority}</span>
                      <span className="pill">{roleRequirement.status}</span>

                      {roleRequirement.preferredTeamRole && (
                        <span className="pill">
                          preferowana rola zespołowa: {roleRequirement.preferredTeamRole}
                        </span>
                      )}

                      <span className="pill">
                        ważność dopasowania zespołowego: {roleRequirement.teamRoleImportance}/5
                      </span>
                    </div>

                    <div className="muted">
                      {roleRequirement.description || "Brak opisu roli."}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak zdefiniowanych ról rekrutacyjnych.</div>
            )}
          </div>

          {team.recruitmentStatus === "OPEN" && (
            <div className="profile-block">
              <div className="profile-block-title">Aplikuj do zespołu</div>

              <form onSubmit={handleApply} style={{ display: "grid", gap: 12 }}>
                <div className="field">
                  <label className="field-label">
                    <b>Docelowa rola projektowa</b>
                  </label>
                  <select
                    className="input"
                    value={targetRoleName}
                    onChange={(e) => setTargetRoleName(e.target.value)}
                  >
                    <option value="">Dowolna / nie wskazano</option>
                    {team.roleRequirements.map((roleRequirement) => (
                      <option
                        key={roleRequirement.id}
                        value={roleRequirement.projectRoleName}
                      >
                        {roleRequirement.projectRoleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">
                    <b>Wiadomość</b>
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Napisz, dlaczego chcesz dołączyć do tego zespołu i co możesz wnieść do projektu."
                  />
                </div>

                <div>
                  <button className="btn btn-solid" disabled={savingApply}>
                    {savingApply ? "Wysyłanie…" : "Wyślij aplikację"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}