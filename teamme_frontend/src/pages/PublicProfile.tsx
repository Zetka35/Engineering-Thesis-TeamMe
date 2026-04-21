import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getUserProfile, type ProjectHistoryItem, type UserProfile } from "../api/user.api";
import { fetchTeam, fetchTeams, inviteToTeam } from "../api/teams.api";
import type { TeamDetails as TeamDetailsModel, TeamSummary } from "../models/Team";
import { extractApiMessage } from "../api/http";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pl-PL");
}

function availabilityLabel(value?: string | null) {
  switch (value) {
    case "OPEN_TO_PROJECTS":
      return "Dostępny/a do projektów";
    case "LIMITED_AVAILABILITY":
      return "Ograniczona dostępność";
    case "NOT_AVAILABLE":
      return "Niedostępny/a";
    default:
      return value || "Nie ustawiono";
  }
}

export default function PublicProfile() {
  const nav = useNavigate();
  const params = useParams();
  const username = params.username ?? "";
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ownedTeams, setOwnedTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamDetailsModel | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);
  const [savingInvite, setSavingInvite] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<number | "">("");
  const [inviteTargetRoleName, setInviteTargetRoleName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    if (!username) return;

    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([getUserProfile(username), fetchTeams()])
      .then(([profileResult, teamsResult]) => {
        if (!mounted) return;

        setProfile(profileResult);

        const ownerTeams = (teamsResult ?? []).filter((team) => team.myRole === "Owner");
        setOwnedTeams(ownerTeams);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(extractApiMessage(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  useEffect(() => {
    let mounted = true;

    if (inviteTeamId === "") {
      setSelectedTeamDetails(null);
      setInviteTargetRoleName("");
      return;
    }

    setLoadingTeamDetails(true);

    fetchTeam(inviteTeamId)
      .then((team) => {
        if (!mounted) return;
        setSelectedTeamDetails(team);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setSelectedTeamDetails(null);
        setError(extractApiMessage(e));
      })
      .finally(() => {
        if (mounted) setLoadingTeamDetails(false);
      });

    return () => {
      mounted = false;
    };
  }, [inviteTeamId]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.username;
  }, [profile]);

  const canInvite = !!profile && !!user && profile.username !== user.username && ownedTeams.length > 0;

  function toggleInvitePanel() {
    setInviteOpen((prev) => !prev);
    setInviteTeamId("");
    setInviteTargetRoleName("");
    setInviteMessage("");
    setSelectedTeamDetails(null);
    setError("");
    setSuccessMsg("");
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!profile) return;

    if (inviteTeamId === "") {
      setError("Wybierz zespół, do którego chcesz zaprosić użytkownika.");
      return;
    }

    setSavingInvite(true);
    setError("");
    setSuccessMsg("");

    try {
      await inviteToTeam(inviteTeamId, {
        username: profile.username,
        targetRoleName: inviteTargetRoleName || null,
        message: inviteMessage,
      });

      setSuccessMsg(
  `Zaproszenie dla użytkownika ${profile.username} zostało wysłane. Odpowiedź pojawi się na liście zgłoszeń i zaproszeń w wybranym zespole.`
);
      setInviteOpen(false);
      setInviteTeamId("");
      setInviteTargetRoleName("");
      setInviteMessage("");
      setSelectedTeamDetails(null);
    } catch (e: unknown) {
      setError(`Nie udało się wysłać zaproszenia. ${extractApiMessage(e)}`);
    } finally {
      setSavingInvite(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie profilu użytkownika…</div>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">
            {error || "Nie udało się załadować profilu użytkownika."}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 className="card-title" style={{ marginBottom: 6 }}>
                {fullName}
              </h2>
              <p className="card-subtitle">@{profile.username}</p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" onClick={() => nav("/network")}>
                Wróć do listy
              </button>
              <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                Zespoły
              </button>

              {canInvite && (
                <button className="btn btn-solid" onClick={toggleInvitePanel}>
                  {inviteOpen ? "Zamknij zaproszenie" : "Zaproś do zespołu"}
                </button>
              )}
            </div>
          </div>
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

          {!canInvite && user?.username !== profile.username && ownedTeams.length === 0 && (
            <div className="profile-block">
              <div className="muted">
                Aby zapraszać użytkowników do zespołu, musisz być właścicielem co najmniej jednego zespołu.
              </div>
            </div>
          )}

          {inviteOpen && (
            <div className="profile-block">
              <div className="profile-block-title">Zaproś użytkownika do zespołu</div>

              <form onSubmit={handleInvite} style={{ display: "grid", gap: 12 }}>
                <div>
                  <label><b>Wybierz zespół</b></label>
                  <select
                    className="input"
                    value={inviteTeamId}
                    onChange={(e) =>
                      setInviteTeamId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  >
                    <option value="">Wybierz…</option>
                    {ownedTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label><b>Docelowa rola projektowa</b></label>
                  <select
                    className="input"
                    value={inviteTargetRoleName}
                    onChange={(e) => setInviteTargetRoleName(e.target.value)}
                    disabled={inviteTeamId === "" || loadingTeamDetails}
                  >
                    <option value="">Dowolna / nie wskazano</option>
                    {selectedTeamDetails?.roleRequirements.map((roleRequirement) => (
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
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Napisz krótką wiadomość do zapraszanej osoby."
                  />
                </div>

                <div>
                  <button className="btn btn-solid" disabled={savingInvite}>
                    {savingInvite ? "Wysyłanie…" : "Wyślij zaproszenie"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="profile-block" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {profile.selectedRole && (
  <span className="pill">rola zespołowa: {profile.selectedRole}</span>
)}
              {profile.headline && <b>{profile.headline}</b>}
            </div>

            <div className="muted">
              Lokalizacja: {profile.location || "—"} | Dostępność: {availabilityLabel(profile.availabilityStatus)}
            </div>

            <div>
              <b>Opis:</b>{" "}
              <span className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {profile.bio || "Brak opisu."}
              </span>
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Linki</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div><b>GitHub:</b> {profile.githubUrl || "—"}</div>
              <div><b>LinkedIn:</b> {profile.linkedinUrl || "—"}</div>
              <div><b>Portfolio:</b> {profile.portfolioUrl || "—"}</div>
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Umiejętności</div>
            {profile.skills?.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {profile.skills.map((skill, index) => (
                  <span key={`${skill.name}-${index}`} className="pill">
                    {skill.name}
                    {skill.level ? ` • ${skill.level}/5` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted">Brak wpisanych umiejętności.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Języki</div>
            {profile.languages?.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {profile.languages.map((language, index) => (
                  <span key={`${language.name}-${index}`} className="pill">
                    {language.name}
                    {language.level ? ` • ${language.level}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted">Brak wpisanych języków.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Doświadczenie zawodowe</div>
            {profile.experiences?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.experiences.map((exp, index) => (
                  <div
                    key={`${exp.companyName}-${exp.position}-${index}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{exp.position}</b>
                      <span className="pill">{exp.companyName}</span>
                      {exp.current && <span className="pill">obecnie</span>}
                    </div>

                    <div className="muted">
                      {formatDate(exp.startDate)} – {exp.current ? "obecnie" : formatDate(exp.endDate)}
                      {exp.employmentType ? ` | ${exp.employmentType}` : ""}
                    </div>

                    <div className="muted">{exp.description || "Brak opisu."}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak doświadczenia zawodowego.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Edukacja</div>
            {profile.educations?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.educations.map((edu, index) => (
                  <div
                    key={`${edu.schoolName}-${edu.fieldOfStudy}-${index}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{edu.schoolName}</b>
                      {edu.degree && <span className="pill">{edu.degree}</span>}
                      {edu.current && <span className="pill">trwa</span>}
                    </div>

                    <div className="muted">
                      {edu.fieldOfStudy || "Brak kierunku"} | {formatDate(edu.startDate)} – {edu.current ? "obecnie" : formatDate(edu.endDate)}
                    </div>

                    <div className="muted">{edu.description || "Brak opisu."}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak edukacji w profilu.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Historia projektów</div>
            {profile.projectHistory?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.projectHistory.map((item: ProjectHistoryItem) => (
                  <div
                    key={`${item.teamId}-${item.joinedAt}-${item.roleLabel}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{item.teamName}</b>
                      <span className="pill">{item.roleLabel}</span>
                      {item.current && <span className="pill">aktualny projekt</span>}
                    </div>

                    <div className="muted">
                      Dołączono: {formatDate(item.joinedAt)} | Zakończono: {item.current ? "—" : formatDate(item.leftAt)}
                    </div>

                    <div className="muted">Status zespołu: {item.teamStatus || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak historii projektów.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}