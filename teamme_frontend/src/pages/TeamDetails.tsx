import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type {
  RecruitmentRequest,
  TeamDetails as TeamDetailsModel,
  TeamExperienceLevel,
  TeamRecruitmentStatus,
} from "../models/Team";
import {
  applyToTeam,
  createMeeting,
  createTask,
  fetchTeam,
  inviteToTeam,
  respondToRequest,
  updateTeam,
  type TeamUpsertPayload,
} from "../api/teams.api";
import { extractApiMessage } from "../api/http";

type TechnologyDraft = {
  name: string;
  requiredLevel: number | "";
  required: boolean;
};

type RoleRequirementDraft = {
  roleName: string;
  slots: number | "";
  description: string;
  priority: number | "";
};

const experienceOptions: Array<{ value: TeamExperienceLevel; label: string }> = [
  { value: "BEGINNER", label: "Początkujący" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
  { value: "MIXED", label: "Mieszany poziom" },
];

const recruitmentOptions: Array<{ value: TeamRecruitmentStatus; label: string }> = [
  { value: "OPEN", label: "Otwarta" },
  { value: "PAUSED", label: "Wstrzymana" },
  { value: "CLOSED", label: "Zamknięta" },
  { value: "FULL", label: "Komplet" },
];

function emptyTechnology(): TechnologyDraft {
  return {
    name: "",
    requiredLevel: "",
    required: true,
  };
}

function emptyRoleRequirement(): RoleRequirementDraft {
  return {
    roleName: "",
    slots: 1,
    description: "",
    priority: 3,
  };
}

function toIso(localValue: string) {
  if (!localValue) return undefined;
  return new Date(localValue).toISOString();
}

function toLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

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

function requestTypeLabel(value?: string | null) {
  switch (value) {
    case "APPLICATION":
      return "Aplikacja";
    case "INVITATION":
      return "Zaproszenie";
    default:
      return value || "—";
  }
}

function requestStatusLabel(value?: string | null) {
  switch (value) {
    case "PENDING":
      return "Oczekujące";
    case "ACCEPTED":
      return "Zaakceptowane";
    case "REJECTED":
      return "Odrzucone";
    case "CANCELLED":
      return "Anulowane";
    default:
      return value || "—";
  }
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedTimeText, setExpectedTimeText] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [projectArea, setProjectArea] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<TeamExperienceLevel>("MIXED");
  const [recruitmentStatus, setRecruitmentStatus] =
    useState<TeamRecruitmentStatus>("OPEN");
  const [technologies, setTechnologies] = useState<TechnologyDraft[]>([emptyTechnology()]);
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirementDraft[]>([
    emptyRoleRequirement(),
  ]);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingStartsAt, setMeetingStartsAt] = useState("");
  const [meetingEndsAt, setMeetingEndsAt] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");

  const [applyTargetRoleName, setApplyTargetRoleName] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteTargetRoleName, setInviteTargetRoleName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const isOwner = !!team && !!user && team.ownerUsername === user.username;
  const isMember = !!team && !!user && team.members.some((m) => m.username === user.username);

  const pendingRequests = useMemo(
    () => (team?.recruitmentRequests ?? []).filter((r) => r.status === "PENDING"),
    [team]
  );

  async function load() {
    if (!Number.isFinite(numericTeamId)) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchTeam(numericTeamId);
      setTeam(data);

      setName(data.name);
      setDescription(data.description ?? "");
      setExpectedTimeText(data.expectedTimeText ?? "");
      setMaxMembers(data.maxMembers);
      setProjectArea(data.projectArea ?? "");
      setExperienceLevel(data.experienceLevel);
      setRecruitmentStatus(data.recruitmentStatus);

      setTechnologies(
        data.technologies?.length
          ? data.technologies.map((t) => ({
              name: t.name ?? "",
              requiredLevel: t.requiredLevel ?? "",
              required: !!t.required,
            }))
          : [emptyTechnology()]
      );

      setRoleRequirements(
        data.roleRequirements?.length
          ? data.roleRequirements.map((r) => ({
              roleName: r.roleName ?? "",
              slots: r.slots ?? 1,
              description: r.description ?? "",
              priority: r.priority ?? 3,
            }))
          : [emptyRoleRequirement()]
      );
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

  function updateTechnology(index: number, patch: Partial<TechnologyDraft>) {
    setTechnologies((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateRoleRequirement(index: number, patch: Partial<RoleRequirementDraft>) {
    setRoleRequirements((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function buildPayload(): TeamUpsertPayload {
    return {
      name,
      description,
      expectedTimeText,
      maxMembers,
      projectArea,
      experienceLevel,
      recruitmentStatus,
      technologies: technologies
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          requiredLevel: t.requiredLevel === "" ? null : Number(t.requiredLevel),
          required: t.required,
        })),
      roleRequirements: roleRequirements
        .filter((r) => r.roleName.trim())
        .map((r) => ({
          roleName: r.roleName.trim(),
          slots: r.slots === "" ? 1 : Number(r.slots),
          description: r.description,
          priority: r.priority === "" ? 3 : Number(r.priority),
        })),
    };
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingProfile(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateTeam(team.id, buildPayload());
      setTeam(updated);
      setSuccessMsg("Profil zespołu został zapisany.");
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingProfile(false);
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

  async function onApply(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingApply(true);
    setError("");
    setSuccessMsg("");

    try {
      await applyToTeam(team.id, {
        targetRoleName: applyTargetRoleName || null,
        message: applyMessage,
      });

      setApplyTargetRoleName("");
      setApplyMessage("");
      setSuccessMsg("Aplikacja do zespołu została wysłana.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingApply(false);
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    setSavingInvite(true);
    setError("");
    setSuccessMsg("");

    try {
      await inviteToTeam(team.id, {
        username: inviteUsername,
        targetRoleName: inviteTargetRoleName || null,
        message: inviteMessage,
      });

      setInviteUsername("");
      setInviteTargetRoleName("");
      setInviteMessage("");
      setSuccessMsg("Zaproszenie zostało wysłane.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setSavingInvite(false);
    }
  }

  async function onRespondRequest(
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

  function canCurrentUserRespond(request: RecruitmentRequest) {
    if (!user) return false;
    if (request.status !== "PENDING") return false;

    if (request.requestType === "APPLICATION") {
      return isOwner || request.username === user.username;
    }

    if (request.requestType === "INVITATION") {
      return isOwner || request.username === user.username;
    }

    return false;
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
            <div className="profile-block">
              <div className="profile-block-title">Edytuj profil zespołu</div>

              <form onSubmit={onSaveProfile} style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  <div>
                    <label><b>Nazwa zespołu</b></label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <div>
                    <label><b>Obszar projektu</b></label>
                    <input
                      className="input"
                      value={projectArea}
                      onChange={(e) => setProjectArea(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label><b>Opis</b></label>
                  <textarea
                    className="input"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <div>
                    <label><b>Przewidywany czas zaangażowania</b></label>
                    <input
                      className="input"
                      value={expectedTimeText}
                      onChange={(e) => setExpectedTimeText(e.target.value)}
                    />
                  </div>

                  <div>
                    <label><b>Liczba miejsc</b></label>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label><b>Poziom doświadczenia</b></label>
                    <select
                      className="input"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as TeamExperienceLevel)}
                    >
                      {experienceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label><b>Status rekrutacji</b></label>
                    <select
                      className="input"
                      value={recruitmentStatus}
                      onChange={(e) =>
                        setRecruitmentStatus(e.target.value as TeamRecruitmentStatus)
                      }
                    >
                      {recruitmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="profile-block" style={{ margin: 0 }}>
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
                    <div className="profile-block-title" style={{ marginBottom: 0 }}>
                      Technologie
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setTechnologies((prev) => [...prev, emptyTechnology()])}
                    >
                      Dodaj technologię
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {technologies.map((technology, index) => (
                      <div
                        key={`tech-${index}`}
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "2fr 1fr auto auto",
                          alignItems: "end",
                        }}
                      >
                        <div>
                          <label><b>Nazwa</b></label>
                          <input
                            className="input"
                            value={technology.name}
                            onChange={(e) =>
                              updateTechnology(index, { name: e.target.value })
                            }
                            placeholder="Np. Spring Boot"
                          />
                        </div>

                        <div>
                          <label><b>Poziom</b></label>
                          <select
                            className="input"
                            value={technology.requiredLevel}
                            onChange={(e) =>
                              updateTechnology(index, {
                                requiredLevel: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                          >
                            <option value="">—</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </div>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 700,
                            paddingBottom: 10,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={technology.required}
                            onChange={(e) =>
                              updateTechnology(index, { required: e.target.checked })
                            }
                          />
                          Wymagana
                        </label>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            setTechnologies((prev) =>
                              prev.length === 1 ? [emptyTechnology()] : prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="profile-block" style={{ margin: 0 }}>
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
                    <div className="profile-block-title" style={{ marginBottom: 0 }}>
                      Poszukiwane role
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setRoleRequirements((prev) => [...prev, emptyRoleRequirement()])
                      }
                    >
                      Dodaj rolę
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {roleRequirements.map((roleRequirement, index) => (
                      <div
                        key={`role-${index}`}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                          padding: 12,
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "2fr 1fr 1fr auto",
                            alignItems: "end",
                          }}
                        >
                          <div>
                            <label><b>Rola</b></label>
                            <input
                              className="input"
                              value={roleRequirement.roleName}
                              onChange={(e) =>
                                updateRoleRequirement(index, { roleName: e.target.value })
                              }
                              placeholder="Np. Backend Developer"
                            />
                          </div>

                          <div>
                            <label><b>Miejsca</b></label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              max={20}
                              value={roleRequirement.slots}
                              onChange={(e) =>
                                updateRoleRequirement(index, {
                                  slots: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div>
                            <label><b>Priorytet</b></label>
                            <select
                              className="input"
                              value={roleRequirement.priority}
                              onChange={(e) =>
                                updateRoleRequirement(index, {
                                  priority: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              setRoleRequirements((prev) =>
                                prev.length === 1
                                  ? [emptyRoleRequirement()]
                                  : prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            Usuń
                          </button>
                        </div>

                        <div>
                          <label><b>Opis roli</b></label>
                          <textarea
                            className="input"
                            rows={3}
                            value={roleRequirement.description}
                            onChange={(e) =>
                              updateRoleRequirement(index, {
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button className="btn btn-solid" disabled={savingProfile}>
                    {savingProfile ? "Zapisywanie…" : "Zapisz profil zespołu"}
                  </button>
                </div>
              </form>
            </div>
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
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <b>{roleRequirement.roleName}</b>
                          <span className="pill">miejsca: {roleRequirement.slots}</span>
                          <span className="pill">priorytet: {roleRequirement.priority}</span>
                          <span className="pill">{roleRequirement.status}</span>
                        </div>
                        <div className="muted">{roleRequirement.description || "Brak opisu roli."}</div>
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

          {!isMember && team.recruitmentStatus === "OPEN" && (
            <div className="profile-block">
              <div className="profile-block-title">Aplikuj do zespołu</div>

              <form onSubmit={onApply} style={{ display: "grid", gap: 12 }}>
                <div>
                  <label><b>Docelowa rola</b></label>
                  <select
                    className="input"
                    value={applyTargetRoleName}
                    onChange={(e) => setApplyTargetRoleName(e.target.value)}
                  >
                    <option value="">Dowolna / nie wskazano</option>
                    {team.roleRequirements.map((roleRequirement) => (
                      <option key={roleRequirement.id} value={roleRequirement.roleName}>
                        {roleRequirement.roleName}
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
                    placeholder="Napisz krótko, dlaczego chcesz dołączyć do zespołu."
                  />
                </div>

                <div>
                  <button className="btn btn-solid" disabled={savingApply}>
                    {savingApply ? "Wysyłanie…" : "Aplikuj do zespołu"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isOwner && (
            <>
              <div className="profile-block">
                <div className="profile-block-title">Zaproś użytkownika</div>

                <form onSubmit={onInvite} style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <div>
                      <label><b>Username użytkownika</b></label>
                      <input
                        className="input"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        placeholder="Np. anna.front"
                        required
                      />
                    </div>

                    <div>
                      <label><b>Rola docelowa</b></label>
                      <select
                        className="input"
                        value={inviteTargetRoleName}
                        onChange={(e) => setInviteTargetRoleName(e.target.value)}
                      >
                        <option value="">Dowolna / nie wskazano</option>
                        {team.roleRequirements.map((roleRequirement) => (
                          <option key={roleRequirement.id} value={roleRequirement.roleName}>
                            {roleRequirement.roleName}
                          </option>
                        ))}
                      </select>
                    </div>
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

              <div className="profile-block">
                <div className="profile-block-title">
                  Rekrutacja — zgłoszenia i zaproszenia ({pendingRequests.length} oczekujących)
                </div>

                {!team.recruitmentRequests.length ? (
                  <div className="muted">Brak zgłoszeń rekrutacyjnych.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {team.recruitmentRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                          padding: 12,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <b>{request.fullName}</b>
                          <span className="muted">@{request.username}</span>
                          <span className="pill">{requestTypeLabel(request.requestType)}</span>
                          <span className="pill">{requestStatusLabel(request.status)}</span>
                          {request.targetRoleName && (
                            <span className="pill">rola: {request.targetRoleName}</span>
                          )}
                        </div>

                        <div className="muted">
                          Utworzono: {formatPl(request.createdAt)} | Autor: {request.createdByUsername || "—"}
                        </div>

                        <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                          {request.message || "Brak wiadomości."}
                        </div>

                        {canCurrentUserRespond(request) && request.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {request.requestType === "APPLICATION" && (
                              <>
                                <button
                                  className="btn btn-solid"
                                  disabled={actingRequestId === request.id}
                                  onClick={() => void onRespondRequest(request.id, "ACCEPTED")}
                                >
                                  {actingRequestId === request.id ? "Zapisywanie…" : "Akceptuj"}
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  disabled={actingRequestId === request.id}
                                  onClick={() => void onRespondRequest(request.id, "REJECTED")}
                                >
                                  Odrzuć
                                </button>
                                {request.username === user?.username && (
                                  <button
                                    className="btn btn-ghost"
                                    disabled={actingRequestId === request.id}
                                    onClick={() => void onRespondRequest(request.id, "CANCELLED")}
                                  >
                                    Anuluj
                                  </button>
                                )}
                              </>
                            )}

                            {request.requestType === "INVITATION" && (
                              <>
                                {request.username === user?.username ? (
                                  <>
                                    <button
                                      className="btn btn-solid"
                                      disabled={actingRequestId === request.id}
                                      onClick={() => void onRespondRequest(request.id, "ACCEPTED")}
                                    >
                                      {actingRequestId === request.id ? "Zapisywanie…" : "Przyjmij"}
                                    </button>
                                    <button
                                      className="btn btn-ghost"
                                      disabled={actingRequestId === request.id}
                                      onClick={() => void onRespondRequest(request.id, "REJECTED")}
                                    >
                                      Odrzuć
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="btn btn-ghost"
                                    disabled={actingRequestId === request.id}
                                    onClick={() => void onRespondRequest(request.id, "CANCELLED")}
                                  >
                                    Anuluj zaproszenie
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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
                      {formatPl(meeting.startsAt)}{meeting.endsAt ? ` – ${formatPl(meeting.endsAt)}` : ""}
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
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{task.title}</b>
                      <span className="pill">{task.status}</span>
                    </div>
                    <div className="muted">
                      Termin: {formatPl(task.dueAt)} | Przypisano: {task.assigneeUsername || "nie przypisano"}
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