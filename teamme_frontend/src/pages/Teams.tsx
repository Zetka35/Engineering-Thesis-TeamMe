import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TeamSummary } from "../models/Team";
import { createTeam, fetchTeams, searchTeams, type TeamUpsertPayload } from "../api/teams.api";
import { extractApiMessage } from "../api/http";
import TeamForm, { type TeamFormValue } from "../components/teams/TeamForm";

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

function toPayload(form: TeamFormValue): TeamUpsertPayload {
  return {
    name: form.name,
    description: form.description,
    expectedTimeText: form.expectedTimeText,
    maxMembers: form.maxMembers,
    projectArea: form.projectArea,
    experienceLevel: form.experienceLevel,
    recruitmentStatus: form.recruitmentStatus,
    technologies: form.technologies
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        requiredLevel: t.requiredLevel === "" ? null : Number(t.requiredLevel),
        required: t.required,
      })),
    roleRequirements: form.roleRequirements
  .filter((r) => r.projectRoleName.trim())
  .map((r) => ({
    projectRoleName: r.projectRoleName.trim(),
    slots: r.slots === "" ? 1 : Number(r.slots),
    description: r.description,
    priority: r.priority === "" ? 3 : Number(r.priority),
    preferredTeamRole: r.preferredTeamRole.trim() || null,
    teamRoleImportance: r.teamRoleImportance === "" ? 3 : Number(r.teamRoleImportance),
  })),
  };
}

export default function Teams() {
  const nav = useNavigate();

  const [myTeams, setMyTeams] = useState<TeamSummary[]>([]);
  const [openTeams, setOpenTeams] = useState<TeamSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [myTeamsResult, openTeamsResult] = await Promise.all([
        fetchTeams(),
        searchTeams(),
      ]);

      setMyTeams(myTeamsResult ?? []);
      setOpenTeams(openTeamsResult ?? []);
    } catch (e: unknown) {
      setError(
        `Nie udało się załadować listy zespołów. ${extractApiMessage(e)}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleOpenTeams = useMemo(() => {
    const myIds = new Set(myTeams.map((team) => team.id));
    return openTeams.filter((team) => !myIds.has(team.id));
  }, [myTeams, openTeams]);

  async function handleCreate(form: TeamFormValue) {
    setSaving(true);
    setError("");

    try {
      const created = await createTeam(toPayload(form));

      nav(`/teams/${created.id}`, {
        state: {
          successMessage:
            "Zespół został utworzony. Możesz teraz doprecyzować wymagania, zaprosić pierwsze osoby albo przejrzeć rekomendowanych kandydatów.",
        },
      });
    } catch (e: unknown) {
      setError(
        `Nie udało się utworzyć zespołu. Sprawdź obowiązkowe pola i spróbuj ponownie. ${extractApiMessage(e)}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Zespoły</h2>
          <p className="card-subtitle">
            Twórz zespoły projektowe, zarządzaj rekrutacją i przeglądaj zespoły, do których możesz dołączyć.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
          {error && <div className="alert">{error}</div>}

          <TeamForm
            title="Utwórz nowy zespół"
            submitLabel="Utwórz zespół"
            saving={saving}
            onSubmit={handleCreate}
          />

          <div className="profile-block">
            <div className="profile-block-title">Moje zespoły</div>

            {loading ? (
              <div className="muted">Ładowanie…</div>
            ) : myTeams.length === 0 ? (
              <div className="muted">
                Nie należysz jeszcze do żadnego zespołu. Zacznij od utworzenia pierwszego zespołu powyżej.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {myTeams.map((team) => (
                  <div key={team.id} className="profile-block">
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
                        <div style={{ fontWeight: 800 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <button className="btn btn-ghost" onClick={() => nav(`/teams/${team.id}`)}>
                        Otwórz
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">moja rola: {team.myRole || "—"}</span>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
                      <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
                      <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
                      <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
                      <span className="pill">spotkanie: {formatPl(team.nextMeetingAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Otwarte zespoły
              </div>

              <button className="btn btn-ghost" onClick={() => nav("/team-search")}>
                Pełne wyszukiwanie
              </button>
            </div>

            {loading ? (
              <div className="muted">Ładowanie…</div>
            ) : visibleOpenTeams.length === 0 ? (
              <div className="muted">Brak innych otwartych zespołów.</div>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {visibleOpenTeams.map((team) => (
                  <div key={team.id} className="profile-block">
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
                        <div style={{ fontWeight: 800 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <button className="btn btn-ghost" onClick={() => nav(`/teams/${team.id}`)}>
                        Szczegóły
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
                      <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
                      <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}