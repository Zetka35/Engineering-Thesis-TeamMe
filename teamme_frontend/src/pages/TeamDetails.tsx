import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { TeamDetails as TeamDetailsModel } from "../models/Team";
import {
  applyToTeam,
  createMeeting,
  createTask,
  fetchRecommendedCandidates,
  fetchTeam,
  inviteToTeam,
  respondToRequest,
  updateTeam,
  type RecommendedCandidate,
  type TeamUpsertPayload,
} from "../api/teams.api";

import { extractApiMessage } from "../api/http";
import TeamForm, { type TeamFormValue } from "../components/teams/TeamForm";
import RecruitmentPanel from "../components/teams/RecruitmentPanel";
import RecommendedCandidates from "../components/teams/RecommendedCandidates";

function formatPl(iso?: string | null) {
  if (!iso) return "—";
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

function toIso(localValue: string) {
  if (!localValue) return undefined;
  return new Date(localValue).toISOString();
}

function toTeamFormValue(team: TeamDetailsModel): TeamFormValue {
  return {
    name: team.name ?? "",
    description: team.description ?? "",
    expectedTimeText: team.expectedTimeText ?? "",
    maxMembers: team.maxMembers ?? 4,
    projectArea: team.projectArea ?? "",
    experienceLevel: team.experienceLevel,
    recruitmentStatus: team.recruitmentStatus,
    technologies:
      team.technologies?.length > 0
        ? team.technologies.map((technology) => ({
            name: technology.name ?? "",
            requiredLevel: technology.requiredLevel ?? "",
            required: !!technology.required,
          }))
        : [{ name: "", requiredLevel: "", required: true }],
    roleRequirements:
      team.roleRequirements?.length > 0
        ? team.roleRequirements.map((roleRequirement) => ({
            roleName: roleRequirement.roleName ?? "",
            slots: roleRequirement.slots ?? 1,
            description: roleRequirement.description ?? "",
            priority: roleRequirement.priority ?? 3,
          }))
        : [{ roleName: "", slots: 1, description: "", priority: 3 }],
  };
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
      .filter((r) => r.roleName.trim())
      .map((r) => ({
        roleName: r.roleName.trim(),
        slots: r.slots === "" ? 1 : Number(r.slots),
        description: r.description,
        priority: r.priority === "" ? 3 : Number(r.priority),
      })),
  };
}

export default function TeamDetails() {
  const { teamId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const numericTeamId = Number(teamId);

  const [team, setTeam] = useState<TeamDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingApply, setSavingApply] = useState(false);
  const [savingInvite, setSavingInvite] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingStartsAt, setMeetingStartsAt] = useState("");
  const [meetingEndsAt, setMeetingEndsAt] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");

  const [recommendedCandidates, setRecommendedCandidates] = useState<RecommendedCandidate[]>([]);
  const [loadingRecommendedCandidates, setLoadingRecommendedCandidates] = useState(false);
  const [recommendedCandidatesError, setRecommendedCandidatesError] = useState("");

  const isOwner = !!team && !!user && team.ownerUsername === user.username;
  const isMember = !!team && !!user && team.members.some((member) => member.username === user.username);

  async function load() {
  if (!Number.isFinite(numericTeamId)) return;

  setLoading(true);
  setError("");

  try {
    const data = await fetchTeam(numericTeamId);
    setTeam(data);

    if (user?.username && data.ownerUsername === user.username) {
      setLoadingRecommendedCandidates(true);
      setRecommendedCandidatesError("");

      try {
        const candidates = await fetchRecommendedCandidates(numericTeamId);
        setRecommendedCandidates(candidates ?? []);
      } catch (e: unknown) {
        setRecommendedCandidates([]);
        setRecommendedCandidatesError(extractApiMessage(e));
      } finally {
        setLoadingRecommendedCandidates(false);
      }
      } else {
        setRecommendedCandidates([]);
        setRecommendedCandidatesError("");
      }
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

  const teamFormInitialValue = useMemo(() => {
    return team ? toTeamFormValue(team) : undefined;
  }, [team]);

  async function handleSaveProfile(form: TeamFormValue) {
    if (!team) return;

    setSavingProfile(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateTeam(team.id, toPayload(form));
      setTeam(updated);
      setSuccessMsg("Profil zespołu został zapisany.");
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleApply(payload: { targetRoleName?: string | null; message?: string }) {
    if (!team) return;

    setSavingApply(true);
    setError("");
    setSuccessMsg("");

    try {
      await applyToTeam(team.id, payload);
      setSuccessMsg("Aplikacja do zespołu została wysłana.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingApply(false);
    }
  }

  async function handleInvite(payload: {
    username: string;
    targetRoleName?: string | null;
    message?: string;
  }) {
    if (!team) return;

    setSavingInvite(true);
    setError("");
    setSuccessMsg("");

    try {
      await inviteToTeam(team.id, payload);
      setSuccessMsg("Zaproszenie zostało wysłane.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingInvite(false);
    }
  }

  async function handleRespondRequest(
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED"
  ) {
    setActingRequestId(requestId);
    setError("");
    setSuccessMsg("");

    try {
      await respondToRequest(requestId, { decision });
      setSuccessMsg("Status zgłoszenia został zaktualizowany.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setActingRequestId(null);
    }
  }

  async function onCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingMeeting(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await createMeeting(team.id, {
        title: meetingTitle,
        description: meetingDescription,
        startsAt: toIso(meetingStartsAt)!,
        endsAt: toIso(meetingEndsAt),
        location: meetingLocation,
      });

      setTeam(updated);
      setMeetingTitle("");
      setMeetingDescription("");
      setMeetingStartsAt("");
      setMeetingEndsAt("");
      setMeetingLocation("");
      setSuccessMsg("Spotkanie zostało dodane.");
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingMeeting(false);
    }
  }

  async function onCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingTask(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await createTask(team.id, {
        title: taskTitle,
        description: taskDescription,
        dueAt: toIso(taskDueAt),
        assigneeUserId: assigneeUserId === "" ? null : assigneeUserId,
      });

      setTeam(updated);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueAt("");
      setAssigneeUserId("");
      setSuccessMsg("Zadanie zostało dodane.");
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingTask(false);
    }
  }

  async function handleInviteCandidate(username: string) {
    if (!team) return;

    setSavingInvite(true);
    setError("");
    setSuccessMsg("");

    try {
      await inviteToTeam(team.id, {
        username,
        targetRoleName: null,
        message: "Zaproszenie wysłane z panelu rekomendowanych kandydatów.",
      });
      setSuccessMsg("Zaproszenie zostało wysłane.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingInvite(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie zespołu…</div>
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
          <p className="card-subtitle">
            Właściciel: {team.ownerUsername || "—"} · moja rola: {team.myRole || "—"}
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

          <div style={{ marginBottom: 4 }}>
            <button className="btn btn-ghost" onClick={() => nav("/teams")}>
              ← Wróć do listy
            </button>
          </div>

          <div className="profile-block" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="pill">status projektu: {team.status}</span>
              <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
              <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
              <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
              <span className="pill">
                członkowie: {team.members.length}/{team.maxMembers}
              </span>
              <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
            </div>

            <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
              {team.description || "Brak opisu projektu."}
            </div>
          </div>

          {isOwner ? (
            <TeamForm
              title="Edytuj profil zespołu"
              submitLabel="Zapisz profil zespołu"
              initialValue={teamFormInitialValue}
              saving={savingProfile}
              onSubmit={handleSaveProfile}
            />
          ) : (
            <>
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
                          <b>{roleRequirement.roleName}</b>
                          <span className="pill">miejsca: {roleRequirement.slots}</span>
                          <span className="pill">priorytet: {roleRequirement.priority}</span>
                          <span className="pill">{roleRequirement.status}</span>
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
            </>
          )}

          <div className="profile-block">
            <div className="profile-block-title">Członkowie</div>
            <div style={{ display: "grid", gap: 8 }}>
              {team.members.map((member) => (
                <div key={member.userId}>
                  <b>{member.fullName}</b>{" "}
                  <span className="muted">(@{member.username})</span> · {member.roleLabel}
                </div>
              ))}
            </div>
          </div>

          <RecruitmentPanel
            isOwner={isOwner}
            isMember={isMember}
            currentUsername={user?.username ?? null}
            recruitmentStatus={team.recruitmentStatus}
            roleRequirements={team.roleRequirements}
            requests={team.recruitmentRequests}
            savingApply={savingApply}
            savingInvite={savingInvite}
            actingRequestId={actingRequestId}
            onApply={handleApply}
            onInvite={handleInvite}
            onRespond={handleRespondRequest}
          />

          {isOwner && (
            <RecommendedCandidates
              candidates={recommendedCandidates}
              loading={loadingRecommendedCandidates}
              error={recommendedCandidatesError}
              onInviteCandidate={handleInviteCandidate}
            />
          )}

          <div className="profile-block">
            <div className="profile-block-title">Nowe spotkanie</div>

            <form onSubmit={onCreateMeeting} style={{ display: "grid", gap: 12 }}>
              <input
                className="input"
                placeholder="Tytuł spotkania"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                required
              />
              <textarea
                className="input"
                rows={3}
                placeholder="Opis spotkania"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
              />
              <input
                className="input"
                type="datetime-local"
                value={meetingStartsAt}
                onChange={(e) => setMeetingStartsAt(e.target.value)}
                required
              />
              <input
                className="input"
                type="datetime-local"
                value={meetingEndsAt}
                onChange={(e) => setMeetingEndsAt(e.target.value)}
              />
              <input
                className="input"
                placeholder="Miejsce / link"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
              />
              <div>
                <button className="btn btn-solid" disabled={savingMeeting}>
                  {savingMeeting ? "Dodawanie…" : "Dodaj spotkanie"}
                </button>
              </div>
            </form>

            {team.meetings.length > 0 && (
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {team.meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <b>{meeting.title}</b>
                    <div className="muted">
                      {formatPl(meeting.startsAt)}
                      {meeting.endsAt ? ` – ${formatPl(meeting.endsAt)}` : ""}
                    </div>
                    <div className="muted">{meeting.location || "Brak lokalizacji"}</div>
                    <div className="muted">{meeting.description || "Brak opisu."}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Nowe zadanie</div>

            <form onSubmit={onCreateTask} style={{ display: "grid", gap: 12 }}>
              <input
                className="input"
                placeholder="Tytuł zadania"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
              <textarea
                className="input"
                rows={3}
                placeholder="Opis zadania"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
              <input
                className="input"
                type="datetime-local"
                value={taskDueAt}
                onChange={(e) => setTaskDueAt(e.target.value)}
              />

              <select
                className="input"
                value={assigneeUserId}
                onChange={(e) =>
                  setAssigneeUserId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Cały zespół / bez przypisania</option>
                {team.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName} (@{member.username})
                  </option>
                ))}
              </select>

              <div>
                <button className="btn btn-solid" disabled={savingTask}>
                  {savingTask ? "Dodawanie…" : "Dodaj zadanie"}
                </button>
              </div>
            </form>

            {team.tasks.length > 0 && (
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {team.tasks.map((task) => (
                  <div
                    key={task.id}
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
                      <b>{task.title}</b>
                      <span className="pill">{task.status}</span>
                    </div>
                    <div className="muted">
                      Termin: {formatPl(task.dueAt)} | Przypisano:{" "}
                      {task.assigneeUsername || "nie przypisano"}
                    </div>
                    <div className="muted">{task.description || "Brak opisu."}</div>
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