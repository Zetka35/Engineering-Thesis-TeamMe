import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyTasks, updateTaskStatus, type TaskBoardItem } from "../api/tasks.api";
import { extractApiMessage } from "../api/http";

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

function statusLabel(value?: string | null) {
  switch (value) {
    case "TODO":
      return "Do zrobienia";
    case "IN_PROGRESS":
      return "W trakcie";
    case "DONE":
      return "Zrobione";
    default:
      return value || "—";
  }
}

export default function Tasks() {
  const nav = useNavigate();

  const [tasks, setTasks] = useState<TaskBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingTaskId, setActingTaskId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyTasks();
      setTasks(data ?? []);
    } catch (e: unknown) {
      setError(`Nie udało się załadować zadań. ${extractApiMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const teamOptions = useMemo(() => {
    return Array.from(
      new Map(tasks.map((task) => [task.teamId, task.teamName])).entries()
    ).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (teamFilter !== "ALL" && String(task.teamId) !== teamFilter) return false;
      if (onlyAssignedToMe && !task.assignedToMe) return false;

      if (!q) return true;

      const haystack = [
        task.title,
        task.description,
        task.teamName,
        task.assigneeUsername,
        task.createdByUsername,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [tasks, query, statusFilter, teamFilter, onlyAssignedToMe]);

  const summary = useMemo(() => {
    const open = tasks.filter((task) => task.status !== "DONE").length;
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const overdue = tasks.filter((task) => task.overdue).length;
    const assigned = tasks.filter((task) => task.assignedToMe && task.status !== "DONE").length;

    return { open, inProgress, overdue, assigned };
  }, [tasks]);

  async function handleStatusChange(
    taskId: number,
    nextStatus: "TODO" | "IN_PROGRESS" | "DONE"
  ) {
    setActingTaskId(taskId);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateTaskStatus(taskId, { status: nextStatus });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      setSuccessMsg("Status zadania został zaktualizowany.");
    } catch (e: unknown) {
      setError(`Nie udało się zmienić statusu zadania. ${extractApiMessage(e)}`);
    } finally {
      setActingTaskId(null);
    }
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
              <h2 className="card-title">Zadania</h2>
              <p className="card-subtitle">
                Przeglądaj zadania ze wszystkich aktywnych zespołów i zarządzaj ich statusem.
              </p>
            </div>

            <button className="btn btn-ghost" onClick={() => nav("/teams")}>
              Wróć do zespołów
            </button>
          </div>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {successMsg && (
            <div
              className="alert alert-success"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

          <div className="form-grid-4" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="profile-block">
              <div className="profile-block-title">Otwarte</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.open}</div>
            </div>
            <div className="profile-block">
              <div className="profile-block-title">W trakcie</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.inProgress}</div>
            </div>
            <div className="profile-block">
              <div className="profile-block-title">Po terminie</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.overdue}</div>
            </div>
            <div className="profile-block">
              <div className="profile-block-title">Przypisane do mnie</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.assigned}</div>
            </div>
          </div>

          <div className="profile-block" style={{ display: "grid", gap: 12 }}>
            <div className="profile-block-title">Filtry</div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <input
                className="input"
                placeholder="Szukaj po tytule, opisie lub zespole"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Wszystkie statusy</option>
                <option value="TODO">Do zrobienia</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="DONE">Zrobione</option>
              </select>

              <select
                className="input"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="ALL">Wszystkie zespoły</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={String(team.id)}>
                    {team.name}
                  </option>
                ))}
              </select>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={onlyAssignedToMe}
                  onChange={(e) => setOnlyAssignedToMe(e.target.checked)}
                />
                Tylko przypisane do mnie
              </label>
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">
              Lista zadań ({filteredTasks.length})
            </div>

            {loading ? (
              <div className="muted">Ładowanie zadań…</div>
            ) : filteredTasks.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 14,
                      padding: 12,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <b>{task.title}</b>
                        <div className="muted">{task.teamName}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="pill">{statusLabel(task.status)}</span>
                        {task.assignedToMe && <span className="pill">przypisane do mnie</span>}
                        {task.overdue && <span className="pill">po terminie</span>}
                      </div>
                    </div>

                    <div className="muted">{task.description || "Brak opisu zadania."}</div>

                    <div className="muted">
                      Termin: {formatPl(task.dueAt)} | Przypisano: {task.assigneeUsername || "nie przypisano"} | Utworzył: {task.createdByUsername || "—"}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-ghost"
                        disabled={actingTaskId === task.id}
                        onClick={() => void handleStatusChange(task.id, "TODO")}
                      >
                        Do zrobienia
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={actingTaskId === task.id}
                        onClick={() => void handleStatusChange(task.id, "IN_PROGRESS")}
                      >
                        W trakcie
                      </button>
                      <button
                        className="btn btn-solid"
                        disabled={actingTaskId === task.id}
                        onClick={() => void handleStatusChange(task.id, "DONE")}
                      >
                        {actingTaskId === task.id ? "Zapisywanie…" : "Oznacz jako zrobione"}
                      </button>

                      <button
                        className="btn btn-ghost"
                        onClick={() => nav(`/teams/${task.teamId}`)}
                      >
                        Otwórz zespół
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak zadań pasujących do filtrów.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}