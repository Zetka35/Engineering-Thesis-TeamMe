import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TeamSummary } from "../models/Team";
import { createTeam, fetchTeams } from "../api/teams.api";

function formatPl(iso?: string | null) {
  if (!iso) return "Brak terminu";
  return new Date(iso).toLocaleString("pl-PL");
}

export default function Teams() {
  const nav = useNavigate();

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedTimeText, setExpectedTimeText] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się pobrać zespołów.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const created = await createTeam({
        name,
        description,
        expectedTimeText,
        maxMembers,
      });

      setName("");
      setDescription("");
      setExpectedTimeText("");
      setMaxMembers(4);

      nav(`/teams/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się utworzyć zespołu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Zespoły</h2>
          <p className="card-subtitle">Tworzenie i przeglądanie realnych zespołów zapisanych w bazie.</p>
        </div>

        <div className="card-body">
          {error && <div className="alert">{error}</div>}

          <div className="profile-block" style={{ marginBottom: 16 }}>
            <div className="profile-block-title">Utwórz zespół</div>

            <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
              <input
                className="input"
                placeholder="Nazwa zespołu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                required
              />

              <textarea
                className="input"
                placeholder="Opis zespołu"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <input
                className="input"
                placeholder="Przewidywany czas, np. 3 miesiące / 5h tygodniowo"
                value={expectedTimeText}
                onChange={(e) => setExpectedTimeText(e.target.value)}
                maxLength={120}
              />

              <input
                className="input"
                type="number"
                min={1}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                required
              />

              <div>
                <button className="btn btn-solid" disabled={saving} type="submit">
                  {saving ? "Tworzenie…" : "Utwórz zespół"}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Moje zespoły</div>

            {loading ? (
              <div className="muted">Ładowanie…</div>
            ) : teams.length === 0 ? (
              <div className="muted">Nie należysz jeszcze do żadnego zespołu.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {teams.map((team) => (
                  <div key={team.id} className="profile-block">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <button className="btn btn-ghost" onClick={() => nav(`/teams/${team.id}`)}>
                        Otwórz
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">moja rola: {team.myRole}</span>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
                      <span className="pill">następne spotkanie: {formatPl(team.nextMeetingAt)}</span>
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