import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  TeamExperienceLevel,
  TeamPublicDetails,
  TeamRecruitmentStatus,
  TeamSummary,
} from "../models/Team";
import { applyToTeam, fetchPublicTeam, searchTeams } from "../api/teams.api";
import { extractApiMessage } from "../api/http";

function formatPl(iso?: string | null) {
  if (!iso) return "Brak terminu";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

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

export default function TeamSearch() {
  const nav = useNavigate();

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublicTeam, setLoadingPublicTeam] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [query, setQuery] = useState("");
  const [projectArea, setProjectArea] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"" | TeamExperienceLevel>("");
  const [recruitmentStatus, setRecruitmentStatus] =
    useState<"" | TeamRecruitmentStatus>("OPEN");

  const [expandedApplyTeamId, setExpandedApplyTeamId] = useState<number | null>(null);
  const [expandedApplyTeamDetails, setExpandedApplyTeamDetails] =
    useState<TeamPublicDetails | null>(null);
  const [applyTargetRoleName, setApplyTargetRoleName] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [savingApply, setSavingApply] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await searchTeams();
      setTeams(result ?? []);
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    const area = projectArea.trim().toLowerCase();

    return teams.filter((team) => {
      const haystack = [
        team.name,
        team.description,
        team.projectArea,
        team.expectedTimeText,
        team.experienceLevel,
        team.recruitmentStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (area && !(team.projectArea || "").toLowerCase().includes(area)) return false;
      if (experienceLevel && team.experienceLevel !== experienceLevel) return false;
      if (recruitmentStatus && team.recruitmentStatus !== recruitmentStatus) return false;

      return true;
    });
  }, [teams, query, projectArea, experienceLevel, recruitmentStatus]);

  async function openApply(teamId: number) {
    if (expandedApplyTeamId === teamId) {
      setExpandedApplyTeamId(null);
      setExpandedApplyTeamDetails(null);
      setApplyTargetRoleName("");
      setApplyMessage("");
      return;
    }

    setLoadingPublicTeam(true);
    setError("");
    setExpandedApplyTeamId(teamId);
    setExpandedApplyTeamDetails(null);
    setApplyTargetRoleName("");
    setApplyMessage("");

    try {
      const data = await fetchPublicTeam(teamId);
      setExpandedApplyTeamDetails(data);
    } catch (e: unknown) {
      setError(extractApiMessage(e));
      setExpandedApplyTeamId(null);
    } finally {
      setLoadingPublicTeam(false);
    }
  }

  async function onApply(teamId: number, e: React.FormEvent) {
    e.preventDefault();
    setSavingApply(true);
    setError("");
    setSuccessMsg("");

    try {
      await applyToTeam(teamId, {
        targetRoleName: applyTargetRoleName || null,
        message: applyMessage,
      });

      setSuccessMsg("Aplikacja została wysłana.");
      setExpandedApplyTeamId(null);
      setExpandedApplyTeamDetails(null);
      setApplyTargetRoleName("");
      setApplyMessage("");
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingApply(false);
    }
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Szukaj zespołu</h2>
          <p className="card-subtitle">
            Przeglądaj otwarte zespoły projektowe i aplikuj do tych, które pasują do Twoich kompetencji.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}
          {successMsg && (
            <div
              className="alert"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

          <div
            className="profile-block"
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label><b>Wyszukaj</b></label>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nazwa, opis, obszar projektu…"
              />
            </div>

            <div>
              <label><b>Obszar projektu</b></label>
              <input
                className="input"
                value={projectArea}
                onChange={(e) => setProjectArea(e.target.value)}
                placeholder="Np. AI, EdTech, Web App"
              />
            </div>

            <div>
              <label><b>Poziom doświadczenia</b></label>
              <select
                className="input"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as "" | TeamExperienceLevel)}
              >
                <option value="">Dowolny</option>
                <option value="BEGINNER">Początkujący</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid</option>
                <option value="SENIOR">Senior</option>
                <option value="MIXED">Mieszany</option>
              </select>
            </div>

            <div>
              <label><b>Status rekrutacji</b></label>
              <select
                className="input"
                value={recruitmentStatus}
                onChange={(e) =>
                  setRecruitmentStatus(e.target.value as "" | TeamRecruitmentStatus)
                }
              >
                <option value="">Dowolny</option>
                <option value="OPEN">Otwarta</option>
                <option value="PAUSED">Wstrzymana</option>
                <option value="CLOSED">Zamknięta</option>
                <option value="FULL">Komplet</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="profile-block">
              <div className="muted">Ładowanie zespołów…</div>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="profile-block">
              <div className="muted">Brak zespołów pasujących do filtrów.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredTeams.map((team) => {
                const isApplyOpen = expandedApplyTeamId === team.id;

                return (
                  <div key={team.id} className="profile-block" style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => nav(`/teams/public/${team.id}`)}
                        >
                          Szczegóły
                        </button>

                        {team.recruitmentStatus === "OPEN" && (
                          <button
                            className="btn btn-solid"
                            onClick={() => void openApply(team.id)}
                          >
                            {isApplyOpen ? "Zamknij formularz" : "Aplikuj"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
                      <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
                      <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
                      <span className="pill">spotkanie: {formatPl(team.nextMeetingAt)}</span>
                    </div>

                    {isApplyOpen && (
                      <form onSubmit={(e) => void onApply(team.id, e)} style={{ display: "grid", gap: 12 }}>
                        <div>
                          <label><b>Docelowa rola</b></label>
                          <select
                            className="input"
                            value={applyTargetRoleName}
                            onChange={(e) => setApplyTargetRoleName(e.target.value)}
                            disabled={loadingPublicTeam}
                          >
                            <option value="">Dowolna / nie wskazano</option>
                            {expandedApplyTeamDetails?.roleRequirements.map((roleRequirement) => (
  <option key={roleRequirement.id} value={roleRequirement.projectRoleName}>
    {roleRequirement.projectRoleName}
  </option>
))}
                          </select>
                        </div>

                        <div>
                          <label><b>Wiadomość</b></label>
                          <textarea
                            className="input"
                            rows={4}
                            value={applyMessage}
                            onChange={(e) => setApplyMessage(e.target.value)}
                            placeholder="Napisz, dlaczego chcesz dołączyć do tego zespołu."
                          />
                        </div>

                        <div>
                          <button className="btn btn-solid" disabled={savingApply || loadingPublicTeam}>
                            {savingApply ? "Wysyłanie…" : "Wyślij aplikację"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}