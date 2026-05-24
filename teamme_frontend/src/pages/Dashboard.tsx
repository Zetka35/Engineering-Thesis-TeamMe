import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTeams, fetchMyRecruitmentRequests } from "../api/teams.api";
import { fetchMyTasks } from "../api/tasks.api";
import { getMyProfile } from "../api/user.api";
import type { TeamSummary, RecruitmentRequest } from "../models/Team";
import type { TaskBoardItem } from "../api/tasks.api";
import type { UserProfile } from "../api/user.api";
import { extractApiMessage } from "../api/http";

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

export default function Dashboard() {
  const nav = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [tasks, setTasks] = useState<TaskBoardItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [profileData, teamsData, requestsData, tasksData] = await Promise.all([
        getMyProfile(),
        fetchTeams(),
        fetchMyRecruitmentRequests(),
        fetchMyTasks(),
      ]);

      setProfile(profileData);
      setTeams(teamsData ?? []);
      setRequests(requestsData ?? []);
      setTasks(tasksData ?? []);
    } catch (e: unknown) {
      setError(`Nie udało się załadować strony głównej. ${extractApiMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => {
    const activeTeams = teams.filter((team) => team.myRole).length;
    const openTasks = tasks.filter((task) => task.status !== "DONE").length;
    const overdueTasks = tasks.filter((task) => task.overdue).length;
    const pendingMessages = requests.filter((request) => request.status === "PENDING").length;
    const completedProjects =
      profile?.projectHistory?.filter((item) => !item.current).length ?? 0;

    return {
      activeTeams,
      openTasks,
      overdueTasks,
      pendingMessages,
      completedProjects,
    };
  }, [teams, tasks, requests, profile]);

  const upcomingMeetings = useMemo(() => {
    return [...teams]
      .filter((team) => !!team.nextMeetingAt)
      .sort((a, b) => {
        const da = a.nextMeetingAt ? new Date(a.nextMeetingAt).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.nextMeetingAt ? new Date(b.nextMeetingAt).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      })
      .slice(0, 5);
  }, [teams]);

  const myOpenTasks = useMemo(() => {
    return tasks
      .filter((task) => task.status !== "DONE")
      .slice(0, 5);
  }, [tasks]);

  const pendingMessages = useMemo(() => {
    return requests.filter((request) => request.status === "PENDING").slice(0, 5);
  }, [requests]);

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Strona główna</h2>
          <p className="card-subtitle">
            {profile?.selectedRole
              ? `Witaj! Twoja aktualna rola zespołowa: ${profile.selectedRole}.`
              : "Witaj w TeamMe. Tutaj znajdziesz najważniejsze informacje o swoich zespołach i zadaniach."}
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="profile-block">
              <div className="muted">Ładowanie strony głównej…</div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                <div className="profile-block">
                  <div className="profile-block-title">Moje zespoły</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.activeTeams}</div>
                </div>

                <div className="profile-block">
                  <div className="profile-block-title">Otwarte zadania</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.openTasks}</div>
                </div>

                <div className="profile-block">
                  <div className="profile-block-title">Po terminie</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.overdueTasks}</div>
                </div>

                <div className="profile-block">
                  <div className="profile-block-title">Wiadomości oczekujące</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.pendingMessages}</div>
                </div>

                <div className="profile-block">
                  <div className="profile-block-title">Zakończone projekty</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.completedProjects}</div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(2, minmax(320px, 1fr))",
                }}
              >
                <div className="profile-block">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="profile-block-title">Moje zespoły</div>
                    <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                      Otwórz
                    </button>
                  </div>

                  {teams.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {teams.slice(0, 5).map((team) => (
                        <div key={team.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                          <b>{team.name}</b>
                          <div className="muted">{team.description || "Brak opisu."}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">Nie należysz jeszcze do żadnego zespołu.</div>
                  )}
                </div>

                <div className="profile-block">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="profile-block-title">Najbliższe spotkania</div>
                    <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                      Zobacz zespoły
                    </button>
                  </div>

                  {upcomingMeetings.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {upcomingMeetings.map((team) => (
                        <div key={team.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                          <b>{team.name}</b>
                          <div className="muted">Termin: {formatPl(team.nextMeetingAt)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">Brak zaplanowanych spotkań.</div>
                  )}
                </div>

                <div className="profile-block">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="profile-block-title">Najbliższe zadania</div>
                    <button className="btn btn-ghost" onClick={() => nav("/tasks")}>
                      Otwórz zadania
                    </button>
                  </div>

                  {myOpenTasks.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {myOpenTasks.map((task) => (
                        <div key={task.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                          <b>{task.title}</b>
                          <div className="muted">{task.teamName}</div>
                          <div className="muted">Termin: {formatPl(task.dueAt)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">Brak otwartych zadań.</div>
                  )}
                </div>

                <div className="profile-block">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="profile-block-title">Oczekujące wiadomości</div>
                    <button className="btn btn-ghost" onClick={() => nav("/messages")}>
                      Otwórz skrzynkę
                    </button>
                  </div>

                  {pendingMessages.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {pendingMessages.map((request) => (
                        <div key={request.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                          <b>{request.teamName}</b>
                          <div className="muted">
                            {request.requestType === "INVITATION" ? "Zaproszenie" : "Aplikacja"} · {request.username}
                          </div>
                          <div className="muted">Utworzono: {formatPl(request.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">Brak oczekujących wiadomości.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}