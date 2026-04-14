import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNetworkUsers, type NetworkUser } from "../api/user.api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--line, #d7e1e8)",
  background: "white",
  font: "inherit",
};

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

export default function Network() {
  const nav = useNavigate();

  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    getNetworkUsers()
      .then((res) => {
        if (!mounted) return;
        setUsers(res ?? []);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message ?? "Nie udało się pobrać listy użytkowników.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const haystack = [
        u.username,
        u.fullName,
        u.firstName,
        u.lastName,
        u.selectedRole,
        u.headline,
        u.location,
        u.bio,
        u.availabilityStatus,
        ...(u.topSkills ?? []).map((x) => x.name),
        ...(u.languages ?? []).map((x) => x.name),
        u.latestProject?.teamName,
        u.latestProject?.roleLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [users, query]);

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie kontaktów…</div>
        </section>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Nawiązywanie kontaktów</h2>
          <p className="card-subtitle">
            Przeglądaj profile innych użytkowników, ich kompetencje i historię projektów.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}

          <div
            className="profile-block"
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "2fr 1fr",
            }}
          >
            <div>
              <label><b>Wyszukaj użytkownika</b></label>
              <input
                style={inputStyle}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po imieniu, roli, skillu, języku lub projekcie"
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div className="muted">
                Znaleziono: {filteredUsers.length}
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="profile-block">
              <div className="muted">Brak użytkowników pasujących do wyszukiwania.</div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              }}
            >
              {filteredUsers.map((u) => (
                <article
                  key={u.username}
                  className="profile-block"
                  style={{ display: "grid", gap: 10 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {u.fullName || u.username}
                      </div>
                      <div className="muted">@{u.username}</div>
                    </div>

                    {u.selectedRole && <span className="pill">{u.selectedRole}</span>}
                  </div>

                  {u.headline && (
                    <div>
                      <b>{u.headline}</b>
                    </div>
                  )}

                  <div className="muted">
                    Lokalizacja: {u.location || "—"} | Dostępność: {availabilityLabel(u.availabilityStatus)}
                  </div>

                  <div>
                    <b>Opis:</b>{" "}
                    <span className="muted" style={{ whiteSpace: "pre-wrap" }}>
                      {u.bio || "Brak opisu."}
                    </span>
                  </div>

                  <div>
                    <b>Top umiejętności:</b>{" "}
                    {u.topSkills?.length ? (
                      <span>
                        {u.topSkills.map((skill) => skill.name).join(", ")}
                      </span>
                    ) : (
                      <span className="muted">Brak danych.</span>
                    )}
                  </div>

                  <div>
                    <b>Języki:</b>{" "}
                    {u.languages?.length ? (
                      <span>
                        {u.languages.map((language) => `${language.name}${language.level ? ` (${language.level})` : ""}`).join(", ")}
                      </span>
                    ) : (
                      <span className="muted">Brak danych.</span>
                    )}
                  </div>

                  <div>
                    <b>Projekt:</b>{" "}
                    {u.latestProject ? (
                      <span>
                        {u.latestProject.teamName} — {u.latestProject.roleLabel}
                        {u.latestProject.current ? " (aktualny)" : " (ostatni)"}
                      </span>
                    ) : (
                      <span className="muted">Brak historii projektów.</span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      className="btn btn-solid"
                      onClick={() => nav(`/network/${encodeURIComponent(u.username)}`)}
                    >
                      Zobacz profil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}