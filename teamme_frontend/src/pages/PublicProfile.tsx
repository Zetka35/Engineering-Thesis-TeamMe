import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserProfile, type ProjectHistoryItem, type UserProfile } from "../api/user.api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pl-PL");
}

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

export default function PublicProfile() {
  const nav = useNavigate();
  const params = useParams();
  const username = params.username ?? "";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    let mounted = true;
    setLoading(true);
    setError("");

    getUserProfile(username)
      .then((res) => {
        if (!mounted) return;
        setProfile(res);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message ?? "Nie udało się pobrać profilu użytkownika.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.username;
  }, [profile]);

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie profilu użytkownika…</div>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">
            {error || "Nie udało się załadować profilu użytkownika."}
          </div>
        </section>
      </div>
    );
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
              <h2 className="card-title" style={{ marginBottom: 6 }}>
                {fullName}
              </h2>
              <p className="card-subtitle">@{profile.username}</p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" onClick={() => nav("/network")}>
                Wróć do listy
              </button>
              <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                Zespoły
              </button>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}

          <div className="profile-block" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {profile.selectedRole && <span className="pill">{profile.selectedRole}</span>}
              {profile.headline && <b>{profile.headline}</b>}
            </div>

            <div className="muted">
              Lokalizacja: {profile.location || "—"} | Dostępność: {availabilityLabel(profile.availabilityStatus)}
            </div>

            <div>
              <b>Opis:</b>{" "}
              <span className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {profile.bio || "Brak opisu."}
              </span>
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Linki</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div><b>GitHub:</b> {profile.githubUrl || "—"}</div>
              <div><b>LinkedIn:</b> {profile.linkedinUrl || "—"}</div>
              <div><b>Portfolio:</b> {profile.portfolioUrl || "—"}</div>
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Umiejętności</div>
            {profile.skills?.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {profile.skills.map((skill, index) => (
                  <span key={`${skill.name}-${index}`} className="pill">
                    {skill.name}
                    {skill.level ? ` • ${skill.level}/5` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted">Brak wpisanych umiejętności.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Języki</div>
            {profile.languages?.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {profile.languages.map((language, index) => (
                  <span key={`${language.name}-${index}`} className="pill">
                    {language.name}
                    {language.level ? ` • ${language.level}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted">Brak wpisanych języków.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Doświadczenie zawodowe</div>
            {profile.experiences?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.experiences.map((exp, index) => (
                  <div
                    key={`${exp.companyName}-${exp.position}-${index}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{exp.position}</b>
                      <span className="pill">{exp.companyName}</span>
                      {exp.current && <span className="pill">obecnie</span>}
                    </div>

                    <div className="muted">
                      {formatDate(exp.startDate)} – {exp.current ? "obecnie" : formatDate(exp.endDate)}
                      {exp.employmentType ? ` | ${exp.employmentType}` : ""}
                    </div>

                    <div className="muted">{exp.description || "Brak opisu."}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak doświadczenia zawodowego.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Edukacja</div>
            {profile.educations?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.educations.map((edu, index) => (
                  <div
                    key={`${edu.schoolName}-${edu.fieldOfStudy}-${index}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{edu.schoolName}</b>
                      {edu.degree && <span className="pill">{edu.degree}</span>}
                      {edu.current && <span className="pill">trwa</span>}
                    </div>

                    <div className="muted">
                      {edu.fieldOfStudy || "Brak kierunku"} | {formatDate(edu.startDate)} – {edu.current ? "obecnie" : formatDate(edu.endDate)}
                    </div>

                    <div className="muted">{edu.description || "Brak opisu."}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak edukacji w profilu.</div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Historia projektów</div>
            {profile.projectHistory?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.projectHistory.map((item: ProjectHistoryItem) => (
                  <div
                    key={`${item.teamId}-${item.joinedAt}-${item.roleLabel}`}
                    style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "grid", gap: 6 }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{item.teamName}</b>
                      <span className="pill">{item.roleLabel}</span>
                      {item.current && <span className="pill">aktualny projekt</span>}
                    </div>

                    <div className="muted">
                      Dołączono: {formatDate(item.joinedAt)} | Zakończono: {item.current ? "—" : formatDate(item.leftAt)}
                    </div>

                    <div className="muted">Status zespołu: {item.teamStatus || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Brak historii projektów.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}