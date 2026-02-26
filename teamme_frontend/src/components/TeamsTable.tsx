import React, { useEffect, useMemo, useState } from "react";
import type { Team } from "../models/Team";
import { fetchTeams } from "../api/teams.api";

function formatPl(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function TeamsTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams()
      .then((data) => setTeams(data))
      .catch((err) => console.error("Błąd pobierania zespołów:", err))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => teams, [teams]);

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Moje zespoły</h2>
        <p className="card-subtitle">Zestawienie zespołów, ról i spotkań.</p>
      </div>

      <div className="table-wrap" role="region" aria-label="Tabela zespołów">
        <table className="teams-table">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Moja Rola</th>
              <th>Członkowie</th>
              <th>Zaplanowane spotkania</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="td-muted">Ładowanie…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="td-muted">Brak zespołów.</td>
              </tr>
            ) : (
              rows.map((team) => (
                <tr key={team.id}>
                  <td className="td-strong">{team.name}</td>
                  <td>
                    <span className="pill">{team.role}</span>
                  </td>
                  <td>
                    <div className="members">
                      {team.members.slice(0, 2).map((m) => (
                        <span key={m} className="member-chip" title={m}>
                          {m}
                        </span>
                      ))}
                      {team.members.length > 2 && (
                        <span className="member-more" title={team.members.join(", ")}>
                          +{team.members.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatPl(team.meetingDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}