import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extractApiFieldErrors, extractApiMessage, pickFieldErrors } from "../api/http";
import { getMySurveyState, type SurveyStateDto } from "../api/survey.api";
import TeamRoleBadge from "../components/TeamRoleBadge";
import VisibilityBadge from "../components/VisibilityBadge";

import {
  getMyProfile,
  updateMyProfile,
  type EducationItem,
  type ExperienceItem,
  type LanguageItem,
  type ProjectHistoryItem,
  type SkillItem,
  type UserProfile,
} from "../api/user.api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--line, #d7e1e8)",
  background: "white",
  font: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
};

function emptyExperience(): ExperienceItem {
  return {
    companyName: "",
    position: "",
    employmentType: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

function emptyEducation(): EducationItem {
  return {
    schoolName: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

function emptySkill(): SkillItem {
  return {
    name: "",
    level: null,
    category: "",
  };
}

function emptyLanguage(): LanguageItem {
  return {
    name: "",
    level: "",
  };
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    bio: profile.bio ?? "",
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    availabilityStatus: profile.availabilityStatus ?? "",
    githubUrl: profile.githubUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    experiences: (profile.experiences ?? []).map((x) => ({
      ...x,
      companyName: x.companyName ?? "",
      position: x.position ?? "",
      employmentType: x.employmentType ?? "",
      startDate: x.startDate ?? "",
      endDate: x.endDate ?? "",
      current: !!x.current,
      description: x.description ?? "",
    })),
    educations: (profile.educations ?? []).map((x) => ({
      ...x,
      schoolName: x.schoolName ?? "",
      degree: x.degree ?? "",
      fieldOfStudy: x.fieldOfStudy ?? "",
      startDate: x.startDate ?? "",
      endDate: x.endDate ?? "",
      current: !!x.current,
      description: x.description ?? "",
    })),
    skills: (profile.skills ?? []).map((x) => ({
      ...x,
      name: x.name ?? "",
      level: x.level ?? null,
      category: x.category ?? "",
    })),
    languages: (profile.languages ?? []).map((x) => ({
      ...x,
      name: x.name ?? "",
      level: x.level ?? "",
    })),
    projectHistory: profile.projectHistory ?? [],
  };
}

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

function surveyActionLabel(surveyState?: SurveyStateDto | null) {
  switch (surveyState?.status) {
    case "COMPLETED":
      return "Zobacz wyniki ankiety";
    case "IN_PROGRESS":
      return "Dokończ ankietę";
    case "NOT_STARTED":
    default:
      return "Uruchom ankietę";
  }
}

function surveyStatusText(surveyState?: SurveyStateDto | null) {
  switch (surveyState?.status) {
    case "COMPLETED":
      return surveyState.completedAt
        ? `Ankieta wykonana ${new Date(surveyState.completedAt).toLocaleString("pl-PL")}`
        : "Ankieta wykonana";
    case "IN_PROGRESS":
      return "Ankieta rozpoczęta — możesz ją dokończyć";
    case "NOT_STARTED":
    default:
      return "Ankieta jeszcze niewykonana";
  }
}

function projectStatusLabel(value?: string | null) {
  switch (value) {
    case "ACTIVE":
      return "aktywny";
    case "COMPLETED":
      return "zakończony";
    case "ARCHIVED":
      return "zarchiwizowany";
    default:
      return value || "—";
  }
}

function initialsFrom(fullName: string, username: string) {
  const source = fullName.trim() || username.trim();
  if (!source) return "U";
  return source
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Profile() {
  const { user, mergeUser } = useAuth();
  const nav = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [surveyState, setSurveyState] = useState<SurveyStateDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user?.username) return;

    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([getMyProfile(), getMySurveyState()])
      .then(([profileResult, surveyResult]) => {
        if (!mounted) return;
        setProfile(normalizeProfile(profileResult));
        setSurveyState(surveyResult);
        setFieldErrors({});
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message ?? "Nie udało się wczytać profilu.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.username]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    const value = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
    return value || profile.username;
  }, [profile]);

  const sortedProjectHistory = useMemo(() => {
    if (!profile) return [];
    return [...profile.projectHistory].sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1;
      const aDate = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const bDate = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [profile]);

  const stats = useMemo(() => {
    if (!profile) {
      return {
        skills: 0,
        experiences: 0,
        languages: 0,
        projects: 0,
      };
    }

    return {
      skills: profile.skills.length,
      experiences: profile.experiences.length,
      languages: profile.languages.length,
      projects: profile.projectHistory.length,
    };
  }, [profile]);

  const avatarImage = user?.avatarDataUrl || profile?.avatarUrl || "";
  const avatarInitials = initialsFrom(fullName, profile?.username ?? "");

  function renderFieldErrors(...fieldNames: string[]) {
    const messages = pickFieldErrors(fieldErrors, ...fieldNames);
    if (!messages.length) return null;

    return (
      <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
        {messages.map((msg, index) => (
          <div
            key={`${fieldNames.join("-")}-${index}`}
            style={{
              color: "#8a1f1f",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {msg}
          </div>
        ))}
      </div>
    );
  }

  function patchProfile(patch: Partial<UserProfile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateExperience(index: number, patch: Partial<ExperienceItem>) {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = prev.experiences.map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...prev, experiences: next };
    });
  }

  function updateEducation(index: number, patch: Partial<EducationItem>) {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = prev.educations.map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...prev, educations: next };
    });
  }

  function updateSkill(index: number, patch: Partial<SkillItem>) {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = prev.skills.map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...prev, skills: next };
    });
  }

  function updateLanguage(index: number, patch: Partial<LanguageItem>) {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = prev.languages.map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...prev, languages: next };
    });
  }

  async function reloadProfile() {
    if (!user?.username) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    try {
      const [profileResult, surveyResult] = await Promise.all([
        getMyProfile(),
        getMySurveyState(),
      ]);

      setProfile(normalizeProfile(profileResult));
      setSurveyState(surveyResult);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się odświeżyć profilu.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    try {
      const updated = await updateMyProfile({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        bio: profile.bio ?? "",
        headline: profile.headline ?? "",
        location: profile.location ?? "",
        availabilityStatus: profile.availabilityStatus ?? "",
        githubUrl: profile.githubUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
        experiences: profile.experiences.map((x) => ({
          companyName: x.companyName ?? "",
          position: x.position ?? "",
          employmentType: x.employmentType ?? "",
          startDate: x.startDate ?? "",
          endDate: x.current ? null : x.endDate || null,
          isCurrent: !!x.current,
          description: x.description ?? "",
        })),
        educations: profile.educations.map((x) => ({
          schoolName: x.schoolName ?? "",
          degree: x.degree ?? "",
          fieldOfStudy: x.fieldOfStudy ?? "",
          startDate: x.startDate ?? "",
          endDate: x.current ? null : x.endDate || null,
          isCurrent: !!x.current,
          description: x.description ?? "",
        })),
        skills: profile.skills.map((x) => ({
          name: x.name ?? "",
          level: x.level ?? null,
          category: x.category ?? "",
        })),
        languages: profile.languages.map((x) => ({
          name: x.name ?? "",
          level: x.level ?? "",
        })),
      });

      const normalized = normalizeProfile(updated);
      setProfile(normalized);

      mergeUser({
        firstName: updated.firstName ?? null,
        lastName: updated.lastName ?? null,
        bio: updated.bio ?? null,
        headline: updated.headline ?? null,
        location: updated.location ?? null,
        availabilityStatus: updated.availabilityStatus ?? null,
        githubUrl: updated.githubUrl ?? null,
        linkedinUrl: updated.linkedinUrl ?? null,
        portfolioUrl: updated.portfolioUrl ?? null,
        selectedRole: updated.selectedRole ?? null,
      });

      setSuccessMsg("Profil został zapisany.");
      setShowEditor(false);
    } catch (e: unknown) {
      setError(extractApiMessage(e));
      setFieldErrors(extractApiFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie profilu…</div>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">
            {error || "Nie udało się załadować profilu."}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page profile-page-shell">
      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && (
        <div
          className="alert alert-success"
        >
          {successMsg}
        </div>
      )}

      <section className="profile-hero-card">
        <div className="profile-hero-cover" />

        <div className="profile-hero-content">
          <div className="profile-hero-topline">
            <div className="profile-hero-breadcrumb">Profil użytkownika / Twoje konto</div>

            <div className="profile-hero-actions">
              <button
                type="button"
                className={showEditor ? "btn btn-ghost" : "btn btn-solid"}
                onClick={() => setShowEditor((prev) => !prev)}
              >
                {showEditor ? "Ukryj edycję" : "Edytuj profil"}
              </button>

              <button type="button" className="btn btn-ghost" onClick={() => nav("/survey")}>
                {surveyActionLabel(surveyState)}
              </button>

              <button
  type="button"
  className="btn btn-ghost"
  onClick={() => nav(`/network/${encodeURIComponent(profile.username)}`)}
>
  Podgląd profilu publicznego
</button>
            </div>
          </div>

          <div className="profile-hero-main">
            <div className="profile-avatar-xl">
              {avatarImage ? (
                <div
                  className="profile-avatar-photo"
                  style={{ backgroundImage: `url(${avatarImage})` }}
                />
              ) : (
                <div className="profile-avatar-fallback">{avatarInitials}</div>
              )}
            </div>

            <div className="profile-hero-summary">
              <h1 className="profile-hero-name">{fullName}</h1>
              <div className="profile-hero-username">@{profile.username}</div>

              <div className="profile-hero-headline">
                {profile.headline || "Uzupełnij nagłówek profilu, aby lepiej opisać swój obszar działania."}
              </div>

              <div className="profile-hero-pills">
                {profile.selectedRole && (
                  <TeamRoleBadge role={profile.selectedRole} />
                )}
                <span className="pill">{availabilityLabel(profile.availabilityStatus)}</span>
                {profile.location && <span className="pill">{profile.location}</span>}
              </div>
            </div>
          </div>

          <div className="profile-hero-tabs">
            <button
              type="button"
              className={`profile-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Przegląd
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Historia projektów
            </button>
          </div>
        </div>
      </section>

      <section className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.skills}</div>
          <div className="profile-stat-label">umiejętności</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.experiences}</div>
          <div className="profile-stat-label">doświadczenia</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.languages}</div>
          <div className="profile-stat-label">języki</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.projects}</div>
          <div className="profile-stat-label">projekty</div>
        </div>
      </section>

      <div className="profile-layout">
        <div className="profile-main-column">
          {activeTab === "overview" ? (
            <>
              <section className="profile-card-modern">
                <div className="profile-card-title">O mnie</div>
                <div className="profile-rich-text">
                  {profile.bio || "Nie dodano jeszcze opisu użytkownika."}
                </div>
              </section>

              <section className="profile-card-modern">
                <div className="profile-card-title">Doświadczenie zawodowe</div>

                {profile.experiences.length ? (
                  <div className="profile-entries-list">
                    {profile.experiences.map((exp, index) => (
                      <div key={exp.id ?? `exp-view-${index}`} className="profile-entry-card">
                        <div className="profile-entry-top">
                          <div>
                            <div className="profile-entry-title">{exp.position || "Brak stanowiska"}</div>
                            <div className="profile-entry-subtitle">{exp.companyName || "Brak firmy"}</div>
                          </div>

                          <div className="profile-entry-pills">
                            {exp.employmentType && <span className="pill">{exp.employmentType}</span>}
                            {exp.current && <span className="pill">obecnie</span>}
                          </div>
                        </div>

                        <div className="profile-entry-meta">
                          {formatDate(exp.startDate)} – {exp.current ? "obecnie" : formatDate(exp.endDate)}
                        </div>

                        <div className="profile-rich-text">
                          {exp.description || "Brak dodatkowego opisu."}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-text">Brak wpisów w doświadczeniu zawodowym.</div>
                )}
              </section>

              <section className="profile-card-modern">
                <div className="profile-card-title">Edukacja</div>

                {profile.educations.length ? (
                  <div className="profile-entries-list">
                    {profile.educations.map((edu, index) => (
                      <div key={edu.id ?? `edu-view-${index}`} className="profile-entry-card">
                        <div className="profile-entry-top">
                          <div>
                            <div className="profile-entry-title">{edu.schoolName || "Brak uczelni / szkoły"}</div>
                            <div className="profile-entry-subtitle">
                              {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ") || "Brak dodatkowych danych"}
                            </div>
                          </div>

                          <div className="profile-entry-pills">
                            {edu.current && <span className="pill">trwa</span>}
                          </div>
                        </div>

                        <div className="profile-entry-meta">
                          {formatDate(edu.startDate)} – {edu.current ? "obecnie" : formatDate(edu.endDate)}
                        </div>

                        <div className="profile-rich-text">
                          {edu.description || "Brak dodatkowego opisu."}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-text">Brak wpisów w edukacji.</div>
                )}
              </section>
            </>
          ) : (
            <section className="profile-card-modern">
              <div className="profile-card-title">Historia projektów</div>

              {sortedProjectHistory.length ? (
                <div className="profile-entries-list">
                  {sortedProjectHistory.map((project: ProjectHistoryItem) => (
                    <div
                      key={`${project.teamId}-${project.joinedAt}-${project.roleLabel}`}
                      className="profile-entry-card"
                    >
                      <div className="profile-entry-top">
                        <div>
                          <div className="profile-entry-title">{project.teamName}</div>
                          <div className="profile-entry-subtitle">{project.roleLabel}</div>
                        </div>

                        <div className="profile-entry-pills">
  <span className="pill">{projectStatusLabel(project.teamStatus)}</span>
  {project.current && <span className="pill">aktywny projekt</span>}
  <VisibilityBadge visible={project.showOnPublicProfile} />
</div>
                      </div>

                      <div className="profile-entry-meta">
                        Dołączono: {formatDate(project.joinedAt)} · Zakończono:{" "}
                        {project.current ? "—" : formatDate(project.leftAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-text">Brak historii projektów.</div>
              )}
            </section>
          )}
        </div>

        <aside className="profile-side-column">
          <section className="profile-card-modern">
            <div className="profile-card-title">Status ankiety</div>
            <div className="profile-rich-text">{surveyStatusText(surveyState)}</div>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost btn-wide" onClick={() => nav("/survey")}>
                {surveyActionLabel(surveyState)}
              </button>
            </div>
          </section>

          <section className="profile-card-modern">
            <div className="profile-card-title">Linki zawodowe</div>
            <div className="profile-info-list">
              <div className="profile-info-row">
                <span>GitHub</span>
                <span>{profile.githubUrl || "—"}</span>
              </div>
              <div className="profile-info-row">
                <span>LinkedIn</span>
                <span>{profile.linkedinUrl || "—"}</span>
              </div>
              <div className="profile-info-row">
                <span>Portfolio</span>
                <span>{profile.portfolioUrl || "—"}</span>
              </div>
            </div>
          </section>

          <section className="profile-card-modern">
            <div className="profile-card-title">Umiejętności</div>

            {profile.skills.length ? (
              <div className="profile-pill-list">
                {profile.skills.map((skill, index) => (
                  <span key={skill.id ?? `skill-view-${index}`} className="pill">
                    {skill.name}
                    {skill.level ? ` · ${skill.level}/5` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="profile-empty-text">Brak wpisanych umiejętności.</div>
            )}
          </section>

          <section className="profile-card-modern">
            <div className="profile-card-title">Języki</div>

            {profile.languages.length ? (
              <div className="profile-pill-list">
                {profile.languages.map((language, index) => (
                  <span key={language.id ?? `lang-view-${index}`} className="pill">
                    {language.name}
                    {language.level ? ` · ${language.level}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div className="profile-empty-text">Brak wpisanych języków.</div>
            )}
          </section>
        </aside>
      </div>

      {showEditor && (
        <section className="profile-editor-shell">
          <div className="profile-editor-header">
            <div>
              <h3 className="profile-editor-title">Edycja profilu</h3>
              <p className="profile-editor-subtitle">
                Zmieniaj dane tylko wtedy, gdy ich potrzebujesz. Widok profilu pozostaje czytelny, a formularz otwiera się na żądanie.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-ghost" onClick={reloadProfile} disabled={saving}>
                Odśwież dane
              </button>
              <button type="button" className="btn btn-solid" onClick={saveProfile} disabled={saving}>
                {saving ? "Zapisywanie…" : "Zapisz profil"}
              </button>
            </div>
          </div>

          <div className="profile-editor-sections">
            <section className="profile-card-modern">
              <div className="profile-card-title">Podstawowe informacje</div>

              <div className="form-grid-2">
                <div>
                  <label><b>Imię</b></label>
                  <input
                    style={inputStyle}
                    value={profile.firstName ?? ""}
                    onChange={(e) => patchProfile({ firstName: e.target.value })}
                    maxLength={80}
                  />
                  {renderFieldErrors("firstName")}
                </div>

                <div>
                  <label><b>Nazwisko</b></label>
                  <input
                    style={inputStyle}
                    value={profile.lastName ?? ""}
                    onChange={(e) => patchProfile({ lastName: e.target.value })}
                    maxLength={80}
                  />
                  {renderFieldErrors("lastName")}
                </div>

                <div>
                  <label><b>Nagłówek profilu</b></label>
                  <input
                    style={inputStyle}
                    value={profile.headline ?? ""}
                    onChange={(e) => patchProfile({ headline: e.target.value })}
                    maxLength={160}
                    placeholder="Np. Frontend Developer / UX / Product"
                  />
                  {renderFieldErrors("headline")}
                </div>

                <div>
                  <label><b>Lokalizacja</b></label>
                  <input
                    style={inputStyle}
                    value={profile.location ?? ""}
                    onChange={(e) => patchProfile({ location: e.target.value })}
                    maxLength={120}
                    placeholder="Np. Warszawa"
                  />
                  {renderFieldErrors("location")}
                </div>

                <div>
                  <label><b>Dostępność</b></label>
                  <select
                    style={selectStyle}
                    value={profile.availabilityStatus ?? ""}
                    onChange={(e) => patchProfile({ availabilityStatus: e.target.value })}
                  >
                    <option value="">Nie ustawiono</option>
                    <option value="OPEN_TO_PROJECTS">Dostępny/a do projektów</option>
                    <option value="LIMITED_AVAILABILITY">Ograniczona dostępność</option>
                    <option value="NOT_AVAILABLE">Niedostępny/a</option>
                  </select>
                </div>

                <div>
                  <label><b>Rola z ankiety</b></label>
                  <div style={{ ...inputStyle, background: "#f8fbfc" }}>
                    {profile.selectedRole || "Brak wybranej roli"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label><b>Opis</b></label>
                <textarea
                  style={textareaStyle}
                  value={profile.bio ?? ""}
                  onChange={(e) => patchProfile({ bio: e.target.value })}
                  maxLength={2000}
                  placeholder="Napisz kilka zdań o sobie, swoich kompetencjach i preferowanym stylu współpracy."
                />
                {renderFieldErrors("bio")}
              </div>
            </section>

            <section className="profile-card-modern">
              <div className="profile-card-title">Linki zawodowe</div>

              <div className="form-grid-3">
                <div>
                  <label><b>GitHub</b></label>
                  <input
                    style={inputStyle}
                    value={profile.githubUrl ?? ""}
                    onChange={(e) => patchProfile({ githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                  {renderFieldErrors("githubUrl")}
                </div>

                <div>
                  <label><b>LinkedIn</b></label>
                  <input
                    style={inputStyle}
                    value={profile.linkedinUrl ?? ""}
                    onChange={(e) => patchProfile({ linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                  {renderFieldErrors("linkedinUrl")}
                </div>

                <div>
                  <label><b>Portfolio</b></label>
                  <input
                    style={inputStyle}
                    value={profile.portfolioUrl ?? ""}
                    onChange={(e) => patchProfile({ portfolioUrl: e.target.value })}
                    placeholder="https://twoja-strona.pl"
                  />
                  {renderFieldErrors("portfolioUrl")}
                </div>
              </div>
            </section>

            <section className="profile-card-modern">
              <div className="profile-editor-section-bar">
                <div className="profile-card-title">Doświadczenie zawodowe</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    patchProfile({
                      experiences: [...profile.experiences, emptyExperience()],
                    })
                  }
                >
                  Dodaj doświadczenie
                </button>
              </div>

              {renderFieldErrors("experiences")}

              <div className="profile-editor-stack">
                {profile.experiences.length === 0 && (
                  <div className="profile-empty-text">Brak wpisów. Dodaj pierwsze doświadczenie.</div>
                )}

                {profile.experiences.map((exp, index) => (
                  <div key={exp.id ?? `exp-edit-${index}`} className="profile-editor-item">
                    <div className="form-grid-3">
                      <div>
                        <label><b>Firma</b></label>
                        <input
                          style={inputStyle}
                          value={exp.companyName ?? ""}
                          onChange={(e) => updateExperience(index, { companyName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Stanowisko</b></label>
                        <input
                          style={inputStyle}
                          value={exp.position ?? ""}
                          onChange={(e) => updateExperience(index, { position: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Typ</b></label>
                        <input
                          style={inputStyle}
                          value={exp.employmentType ?? ""}
                          onChange={(e) => updateExperience(index, { employmentType: e.target.value })}
                          placeholder="Np. Staż / B2B / Praktyki"
                        />
                      </div>

                      <div>
                        <label><b>Data od</b></label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={exp.startDate ?? ""}
                          onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Data do</b></label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={exp.current ? "" : exp.endDate ?? ""}
                          disabled={exp.current}
                          onChange={(e) => updateExperience(index, { endDate: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <label className="checkbox-line">
                          <input
                            type="checkbox"
                            checked={!!exp.current}
                            onChange={(e) =>
                              updateExperience(index, {
                                current: e.target.checked,
                                endDate: e.target.checked ? "" : exp.endDate ?? "",
                              })
                            }
                          />
                          Obecne miejsce pracy
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label><b>Opis</b></label>
                      <textarea
                        style={textareaStyle}
                        value={exp.description ?? ""}
                        onChange={(e) => updateExperience(index, { description: e.target.value })}
                        placeholder="Zakres obowiązków, technologie, rezultaty."
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          patchProfile({
                            experiences: profile.experiences.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card-modern">
              <div className="profile-editor-section-bar">
                <div className="profile-card-title">Edukacja</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    patchProfile({
                      educations: [...profile.educations, emptyEducation()],
                    })
                  }
                >
                  Dodaj edukację
                </button>
              </div>

              {renderFieldErrors("educations")}

              <div className="profile-editor-stack">
                {profile.educations.length === 0 && (
                  <div className="profile-empty-text">Brak wpisów. Dodaj edukację.</div>
                )}

                {profile.educations.map((edu, index) => (
                  <div key={edu.id ?? `edu-edit-${index}`} className="profile-editor-item">
                    <div className="form-grid-3">
                      <div>
                        <label><b>Szkoła / uczelnia</b></label>
                        <input
                          style={inputStyle}
                          value={edu.schoolName ?? ""}
                          onChange={(e) => updateEducation(index, { schoolName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Stopień / tytuł</b></label>
                        <input
                          style={inputStyle}
                          value={edu.degree ?? ""}
                          onChange={(e) => updateEducation(index, { degree: e.target.value })}
                          placeholder="Np. Inżynier"
                        />
                      </div>

                      <div>
                        <label><b>Kierunek</b></label>
                        <input
                          style={inputStyle}
                          value={edu.fieldOfStudy ?? ""}
                          onChange={(e) => updateEducation(index, { fieldOfStudy: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Data od</b></label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={edu.startDate ?? ""}
                          onChange={(e) => updateEducation(index, { startDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label><b>Data do</b></label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={edu.current ? "" : edu.endDate ?? ""}
                          disabled={edu.current}
                          onChange={(e) => updateEducation(index, { endDate: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <label className="checkbox-line">
                          <input
                            type="checkbox"
                            checked={!!edu.current}
                            onChange={(e) =>
                              updateEducation(index, {
                                current: e.target.checked,
                                endDate: e.target.checked ? "" : edu.endDate ?? "",
                              })
                            }
                          />
                          Trwa obecnie
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label><b>Opis</b></label>
                      <textarea
                        style={textareaStyle}
                        value={edu.description ?? ""}
                        onChange={(e) => updateEducation(index, { description: e.target.value })}
                        placeholder="Specjalizacja, osiągnięcia, ważne kursy."
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          patchProfile({
                            educations: profile.educations.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card-modern">
              <div className="profile-editor-section-bar">
                <div className="profile-card-title">Umiejętności</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    patchProfile({
                      skills: [...profile.skills, emptySkill()],
                    })
                  }
                >
                  Dodaj umiejętność
                </button>
              </div>

              {renderFieldErrors("skills")}

              <div className="profile-editor-stack">
                {profile.skills.length === 0 && (
                  <div className="profile-empty-text">Brak wpisów. Dodaj umiejętności.</div>
                )}

                {profile.skills.map((skill, index) => (
                  <div key={skill.id ?? `skill-edit-${index}`} className="profile-editor-item">
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "2fr 1fr 1fr auto",
                        alignItems: "end",
                      }}
                    >
                      <div>
                        <label><b>Nazwa</b></label>
                        <input
                          style={inputStyle}
                          value={skill.name ?? ""}
                          onChange={(e) => updateSkill(index, { name: e.target.value })}
                          placeholder="Np. React"
                        />
                      </div>

                      <div>
                        <label><b>Poziom</b></label>
                        <select
                          style={selectStyle}
                          value={skill.level ?? ""}
                          onChange={(e) =>
                            updateSkill(index, {
                              level: e.target.value ? Number(e.target.value) : null,
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

                      <div>
                        <label><b>Kategoria</b></label>
                        <input
                          style={inputStyle}
                          value={skill.category ?? ""}
                          onChange={(e) => updateSkill(index, { category: e.target.value })}
                          placeholder="Np. FRONTEND"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          patchProfile({
                            skills: profile.skills.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card-modern">
              <div className="profile-editor-section-bar">
                <div className="profile-card-title">Języki</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    patchProfile({
                      languages: [...profile.languages, emptyLanguage()],
                    })
                  }
                >
                  Dodaj język
                </button>
              </div>

              {renderFieldErrors("languages")}

              <div className="profile-editor-stack">
                {profile.languages.length === 0 && (
                  <div className="profile-empty-text">Brak wpisów. Dodaj język.</div>
                )}

                {profile.languages.map((language, index) => (
                  <div key={language.id ?? `lang-edit-${index}`} className="profile-editor-item">
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "2fr 1fr auto",
                        alignItems: "end",
                      }}
                    >
                      <div>
                        <label><b>Nazwa</b></label>
                        <input
                          style={inputStyle}
                          value={language.name ?? ""}
                          onChange={(e) => updateLanguage(index, { name: e.target.value })}
                          placeholder="Np. angielski"
                        />
                      </div>

                      <div>
                        <label><b>Poziom</b></label>
                        <input
                          style={inputStyle}
                          value={language.level ?? ""}
                          onChange={(e) => updateLanguage(index, { level: e.target.value })}
                          placeholder="Np. B2 / C1"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          patchProfile({
                            languages: profile.languages.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}
    </div>
  );
}