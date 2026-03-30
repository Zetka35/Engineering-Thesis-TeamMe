import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TeamDetails as TeamDetailsModel } from "../models/Team";
import { createMeeting, createTask, fetchTeam, updateTeam } from "../api/teams.api";

function toIso(localValue: string) {
  if (!localValue) return undefined;
  return new Date(localValue).toISOString();
}

export default function TeamDetails() {
  const { teamId } = useParams();
  const nav = useNavigate();
  const numericTeamId = Number(teamId);

  const [team, setTeam] = useState<TeamDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedTimeText, setExpectedTimeText] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingStartsAt, setMeetingStartsAt] = useState("");
  const [meetingEndsAt, setMeetingEndsAt] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTeam(numericTeamId);
      setTeam(data);
      setName(data.name);
      setDescription(data.description ?? "");
      setExpectedTimeText(data.expectedTimeText ?? "");
      setMaxMembers(data.maxMembers);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się pobrać zespołu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(numericTeamId)) return;
    load();
  }, [numericTeamId]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateTeam(numericTeamId, {
        name,
        description,
        expectedTimeText,
        maxMembers,
      });
      setTeam(updated);
      setSuccessMsg("Profil zespołu został zapisany.");
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zapisać profilu zespołu.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeeting(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await createMeeting(numericTeamId, {
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
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się dodać spotkania.");
    } finally {
      setSavingMeeting(false);
    }
  }

  async function onCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setSavingTask(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await createTask(numericTeamId, {
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
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się dodać zadania.");
    } finally {
      setSavingTask(false);
    }
  }

  if (loading) return <div className="page"><section className="card"><div className="card-body">Ładowanie zespołu…</div></section></div>;
  if (!team) return <div className="page"><section className="card"><div className="card-body">Nie znaleziono zespołu.</div></section></div>;

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">{team.name}</h2>
          <p className="card-subtitle">Właściciel: {team.ownerUsername || "—"} · moja rola: {team.myRole}</p>
        </div>

        <div className="card-body">
          {error && <div className="alert">{error}</div>}
          {successMsg && <div className="alert" style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}>{successMsg}</div>}

          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost" onClick={() => nav("/teams")}>← Wróć do listy</button>
          </div>

          <div className="profile-block" style={{ marginBottom: 16 }}>
            <div className="profile-block-title">Profil zespołu</div>

            <form onSubmit={onSaveProfile} style={{ display: "grid", gap: 12 }}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              <input className="input" value={expectedTimeText} onChange={(e) => setExpectedTimeText(e.target.value)} />
              <input className="input" type="number" min={1} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} required />
              <div>
                <button className="btn btn-solid" disabled={savingProfile}>
                  {savingProfile ? "Zapisywanie…" : "Zapisz profil zespołu"}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-block" style={{ marginBottom: 16 }}>
            <div className="profile-block-title">Członkowie</div>
            <div style={{ display: "grid", gap: 8 }}>
              {team.members.map((m) => (
                <div key={m.userId}>
                  <b>{m.fullName}</b> <span className="muted">(@{m.username})</span> · {m.roleLabel}
                </div>
              ))}
            </div>
          </div>

          <div className="profile-block" style={{ marginBottom: 16 }}>
            <div className="profile-block-title">Nowe spotkanie</div>

            <form onSubmit={onCreateMeeting} style={{ display: "grid", gap: 12 }}>
              <input className="input" placeholder="Tytuł spotkania" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} required />
              <textarea className="input" rows={3} placeholder="Opis spotkania" value={meetingDescription} onChange={(e) => setMeetingDescription(e.target.value)} />
              <input className="input" type="datetime-local" value={meetingStartsAt} onChange={(e) => setMeetingStartsAt(e.target.value)} required />
              <input className="input" type="datetime-local" value={meetingEndsAt} onChange={(e) => setMeetingEndsAt(e.target.value)} />
              <input className="input" placeholder="Miejsce / link" value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} />
              <div>
                <button className="btn btn-solid" disabled={savingMeeting}>
                  {savingMeeting ? "Dodawanie…" : "Dodaj spotkanie"}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Nowe zadanie</div>

            <form onSubmit={onCreateTask} style={{ display: "grid", gap: 12 }}>
              <input className="input" placeholder="Tytuł zadania" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              <textarea className="input" rows={3} placeholder="Opis zadania" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
              <input className="input" type="datetime-local" value={taskDueAt} onChange={(e) => setTaskDueAt(e.target.value)} />

              <select
                className="input"
                value={assigneeUserId}
                onChange={(e) => setAssigneeUserId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Cały zespół / bez przypisania</option>
                {team.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} (@{m.username})
                  </option>
                ))}
              </select>

              <div>
                <button className="btn btn-solid" disabled={savingTask}>
                  {savingTask ? "Dodawanie…" : "Dodaj zadanie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}