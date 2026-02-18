import React, { useEffect, useState } from "react";
import type { Team } from "../models/Team"; //
import { fetchTeams } from "../api/teams.api";

export default function TeamsTable() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(err => console.error("Błąd pobierania zespołów:", err));
  }, []);

  return (
    <table className="teams-table">
      <thead>
        <tr>
          <th>Nazwa</th>
          <th>Moja rola</th>
          <th>Członkowie</th>
          <th>Zaplanowane spotkania</th>
        </tr>
      </thead>
      <tbody>
        {teams.map(team => (
          <tr key={team.id}>
            <td>{team.name}</td>
            <td>{team.role}</td>
            <td>{team.members.join(", ")}</td>
            <td>{new Date(team.meetingDate).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
