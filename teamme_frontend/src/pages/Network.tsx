import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getNetworkUsers, type NetworkUser } from "../api/user.api";
import { fetchTeam, fetchTeams, inviteToTeam } from "../api/teams.api";
import type { TeamDetails, TeamSummary } from "../models/Team";
import { extractApiMessage } from "../api/http";

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
  const { user } = useAuth();

  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [ownedTeams, setOwnedTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [query, setQuery] = useState("");

  const [expandedInviteUsername, setExpandedInviteUsername] = useState<string | null>(null);
  const [inviteTeamId, setInviteTeamId] = useState<number | "">("");
  const [inviteTargetRoleName, setInviteTargetRoleName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [savingInvite, setSavingInvite] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([getNetworkUsers(), fetchTeams()])
      .then(([networkUsers, myTeams]) => {
        if (!mounted) return;

        const currentUsername = user?.username;
        const filteredUsers = (networkUsers ?? []).filter(
          (networkUser) => networkUser.username !== currentUsername
        );

        const ownerTeams = (myTeams ?? []).filter((team) => team.myRole === "Owner");

        setUsers(filteredUsers);
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
  }, [user?.username]);

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

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((networkUser) => {
      const haystack = [
        networkUser.username,
        networkUser.fullName,
        networkUser.firstName,
        networkUser.lastName,
        networkUser.selectedRole,
        networkUser.headline,
        networkUser.location,
        networkUser.bio,
        networkUser.availabilityStatus,
        ...(networkUser.topSkills ?? []).map((skill) => skill.name),
        ...(networkUser.languages ?? []).map((language) => language.name),
        networkUser.latestProject?.teamName,
        networkUser.latestProject?.roleLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [users, query]);

  function openInvite(username: string) {
    setExpandedInviteUsername((prev) => (prev === username ? null : username));
    setInviteTeamId("");
    setInviteTargetRoleName("");
    setInviteMessage("");
    setSelectedTeamDetails(null);
    setError("");
    setSuccessMsg("");
  }

  async function handleInvite(
    e: React.FormEvent,
    targetUsername: string
  ) {
    e.preventDefault();

    if (inviteTeamId === "") {
      setError("Wybierz zespół, do którego chcesz zaprosić użytkownika.");
      return;
    }

    setSavingInvite(true);
    setError("");
    setSuccessMsg("");

    try {
      await inviteToTeam(inviteTeamId, {
        username: targetUsername,
        targetRoleName: inviteTargetRoleName || null,
        message: inviteMessage,
      });

      setSuccessMsg(`Zaproszenie dla użytkownika ${targetUsername} zostało wysłane.`);
      setExpandedInviteUsername(null);
      setInviteTeamId("");
      setInviteTargetRoleName("");
      setInviteMessage("");
      setSelectedTeamDetails(null);
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
          {successMsg && (
            <div
              className="alert"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

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

          {ownedTeams.length === 0 && (
            <div className="profile-block">
              <div className="muted">
                Nie masz jeszcze zespołu jako właściciel. Aby zapraszać użytkowników, utwórz własny zespół.
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                  Przejdź do zespołów
                </button>
              </div>
            </div>
          )}

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
              {filteredUsers.map((networkUser) => {
                const isInviteOpen = expandedInviteUsername === networkUser.username;

                return (
                  <article
                    key={networkUser.username}
                    className="profile-block"
                    style={{ display: "grid", gap: 10 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>
                          {networkUser.fullName || networkUser.username}
                        </div>
                        <div className="muted">@{networkUser.username}</div>
                      </div>

                      {networkUser.selectedRole && (
                        <span className="pill">{networkUser.selectedRole}</span>
                      )}
                    </div>

                    {networkUser.headline && (
                      <div>
                        <b>{networkUser.headline}</b>
                      </div>
                    )}

                    <div className="muted">
                      Lokalizacja: {networkUser.location || "—"} | Dostępność:{" "}
                      {availabilityLabel(networkUser.availabilityStatus)}
                    </div>

                    <div>
                      <b>Opis:</b>{" "}
                      <span className="muted" style={{ whiteSpace: "pre-wrap" }}>
                        {networkUser.bio || "Brak opisu."}
                      </span>
                    </div>

                    <div>
                      <b>Top umiejętności:</b>{" "}
                      {networkUser.topSkills?.length ? (
                        <span>{networkUser.topSkills.map((skill) => skill.name).join(", ")}</span>
                      ) : (
                        <span className="muted">Brak danych.</span>
                      )}
                    </div>

                    <div>
                      <b>Języki:</b>{" "}
                      {networkUser.languages?.length ? (
                        <span>
                          {networkUser.languages
                            .map(
                              (language) =>
                                `${language.name}${language.level ? ` (${language.level})` : ""}`
                            )
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="muted">Brak danych.</span>
                      )}
                    </div>

                    <div>
                      <b>Projekt:</b>{" "}
                      {networkUser.latestProject ? (
                        <span>
                          {networkUser.latestProject.teamName} —{" "}
                          {networkUser.latestProject.roleLabel}
                          {networkUser.latestProject.current ? " (aktualny)" : " (ostatni)"}
                        </span>
                      ) : (
                        <span className="muted">Brak historii projektów.</span>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          nav(`/network/${encodeURIComponent(networkUser.username)}`)
                        }
                      >
                        Zobacz profil
                      </button>

                      {ownedTeams.length > 0 && (
                        <button
                          className="btn btn-solid"
                          onClick={() => openInvite(networkUser.username)}
                        >
                          {isInviteOpen ? "Zamknij zaproszenie" : "Zaproś do zespołu"}
                        </button>
                      )}
                    </div>

                    {isInviteOpen && (
                      <form
                        onSubmit={(e) => void handleInvite(e, networkUser.username)}
                        style={{
                          marginTop: 6,
                          display: "grid",
                          gap: 12,
                          borderTop: "1px solid var(--line)",
                          paddingTop: 12,
                        }}
                      >
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
                          <label><b>Docelowa rola</b></label>
                          <select
                            className="input"
                            value={inviteTargetRoleName}
                            onChange={(e) => setInviteTargetRoleName(e.target.value)}
                            disabled={inviteTeamId === "" || loadingTeamDetails}
                          >
                            <option value="">Dowolna / nie wskazano</option>
                            {selectedTeamDetails?.roleRequirements.map((roleRequirement) => (
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
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}