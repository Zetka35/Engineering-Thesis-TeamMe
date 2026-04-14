import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMySurveyState, type SurveyStateDto } from "../api/survey.api";
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
  borderRadius: 10,
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
        ? `ankieta wykonana ${new Date(surveyState.completedAt).toLocaleString("pl-PL")}`
        : "ankieta wykonana";
    case "IN_PROGRESS":
      return "ankieta rozpoczęta — możesz ją dokończyć";
    case "NOT_STARTED":
    default:
      return "ankieta jeszcze niewykonana";
  }
}

export default function Profile() {
  const { user, mergeUser } = useAuth();
  const nav = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [surveyState, setSurveyState] = useState<SurveyStateDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user?.username) return;

    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      getMyProfile(),
      getMySurveyState(),
    ])
      .then(([profileResult, surveyResult]) => {
        if (!mounted) return;
        setProfile(normalizeProfile(profileResult));
        setSurveyState(surveyResult);
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
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zapisać profilu.");
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
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Profil</h2>
          <p className="card-subtitle">
            Rozszerz swój profil o doświadczenie, edukację, umiejętności, języki i historię projektów.
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
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <b>Użytkownik:</b> {profile.username}
              </div>
              <div>
                <b>Imię i nazwisko:</b> {fullName}
              </div>
              <div>
                <b>Wybrana rola:</b>{" "}
                {profile.selectedRole ? <span className="pill">{profile.selectedRole}</span> : "—"}
              </div>
              <div>
                <b>Dostępność:</b> {availabilityLabel(profile.availabilityStatus)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-solid" onClick={saveProfile} disabled={saving}>
                {saving ? "Zapisywanie…" : "Zapisz profil"}
              </button>
              <button className="btn btn-ghost" onClick={reloadProfile} disabled={saving}>
                Odśwież dane
              </button>
              <button className="btn btn-ghost" onClick={() => nav("/survey")}>
                {surveyActionLabel(surveyState)}
              </button>
            </div>
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              <div>
                <label><b>Imię</b></label>
                <input
                  style={inputStyle}
                  value={profile.firstName ?? ""}
                  onChange={(e) => patchProfile({ firstName: e.target.value })}
                  maxLength={80}
                />
              </div>

              <div>
                <label><b>Nazwisko</b></label>
                <input
                  style={inputStyle}
                  value={profile.lastName ?? ""}
                  onChange={(e) => patchProfile({ lastName: e.target.value })}
                  maxLength={80}
                />
              </div>

              <div>
                <label><b>Nagłówek profilu</b></label>
                <input
                  style={inputStyle}
                  value={profile.headline ?? ""}
                  onChange={(e) => patchProfile({ headline: e.target.value })}
                  maxLength={160}
                  placeholder="Np. Frontend Developer / UX"
                />
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
                placeholder="Napisz kilka zdań o sobie, swoich zainteresowaniach i preferowanej roli w zespole."
              />
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-title">Linki zawodowe</div>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              <div>
                <label><b>GitHub</b></label>
                <input
                  style={inputStyle}
                  value={profile.githubUrl ?? ""}
                  onChange={(e) => patchProfile({ githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label><b>LinkedIn</b></label>
                <input
                  style={inputStyle}
                  value={profile.linkedinUrl ?? ""}
                  onChange={(e) => patchProfile({ linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label><b>Portfolio</b></label>
                <input
                  style={inputStyle}
                  value={profile.portfolioUrl ?? ""}
                  onChange={(e) => patchProfile({ portfolioUrl: e.target.value })}
                  placeholder="https://twoja-strona.pl"
                />
              </div>
            </div>
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Doświadczenie zawodowe
              </div>
              <button
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

            <div style={{ display: "grid", gap: 12 }}>
              {profile.experiences.length === 0 && (
                <div className="muted">Brak wpisów. Dodaj pierwsze doświadczenie.</div>
              )}

              {profile.experiences.map((exp, index) => (
                <div key={exp.id ?? `exp-${index}`} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
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
                      <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
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
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Edukacja
              </div>
              <button
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

            <div style={{ display: "grid", gap: 12 }}>
              {profile.educations.length === 0 && (
                <div className="muted">Brak wpisów. Dodaj edukację.</div>
              )}

              {profile.educations.map((edu, index) => (
                <div key={edu.id ?? `edu-${index}`} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
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
                      <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
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
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Umiejętności
              </div>
              <button
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

            <div style={{ display: "grid", gap: 10 }}>
              {profile.skills.length === 0 && (
                <div className="muted">Brak wpisów. Dodaj umiejętności.</div>
              )}

              {profile.skills.map((skill, index) => (
                <div
                  key={skill.id ?? `skill-${index}`}
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
              ))}
            </div>
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Języki
              </div>
              <button
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

            <div style={{ display: "grid", gap: 10 }}>
              {profile.languages.length === 0 && (
                <div className="muted">Brak wpisów. Dodaj języki.</div>
              )}

              {profile.languages.map((language, index) => (
                <div
                  key={language.id ?? `lang-${index}`}
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "2fr 1fr auto",
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label><b>Język</b></label>
                    <input
                      style={inputStyle}
                      value={language.name ?? ""}
                      onChange={(e) => updateLanguage(index, { name: e.target.value })}
                      placeholder="Np. Angielski"
                    />
                  </div>

                  <div>
                    <label><b>Poziom</b></label>
                    <input
                      style={inputStyle}
                      value={language.level ?? ""}
                      onChange={(e) => updateLanguage(index, { level: e.target.value })}
                      placeholder="Np. B2 / C1 / Native"
                    />
                  </div>

                  <button
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
              ))}
            </div>
          </div>

         <div className="profile-block">
  <div className="profile-block-title">Ankieta „Moja rola w zespole”</div>

  <div style={{ display: "grid", gap: 10 }}>
    <div>
      <b>Status:</b> {surveyStatusText(surveyState)}
    </div>

    {surveyState?.status === "IN_PROGRESS" && (
      <div className="muted">
        Ankieta została rozpoczęta i zapisana roboczo. Możesz wrócić do niej w dowolnym momencie.
      </div>
    )}

    {surveyState?.status === "COMPLETED" && surveyState.result?.topRoles?.length ? (
      <>
        <div>
          <b>Top 3 role:</b>{" "}
          {surveyState.result.topRoles
            .map((x) => `${x.key} (${Math.max(0, Math.min(1, x.finalScore)).toFixed(3)})`)
            .join(", ")}
        </div>

        <div className="muted">
          Ankieta pokazuje pełną listę 7 ról, a trzy najlepiej dopasowane są oznaczone jako rekomendowane.
        </div>
      </>
    ) : null}

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button className="btn btn-solid" onClick={() => nav("/survey")}>
        {surveyActionLabel(surveyState)}
      </button>
    </div>
  </div>
</div>

          <div className="profile-block">
            <div className="profile-block-title">Historia projektów</div>

            <div style={{ display: "grid", gap: 10 }}>
              {profile.projectHistory.length === 0 ? (
                <div className="muted">Brak historii projektów.</div>
              ) : (
                profile.projectHistory.map((item: ProjectHistoryItem) => (
                  <div
                    key={`${item.teamId}-${item.joinedAt}-${item.roleLabel}`}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 14,
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <b>{item.teamName}</b>
                      <span className="pill">{item.roleLabel}</span>
                      {item.current && <span className="pill">aktualny projekt</span>}
                    </div>

                    <div className="muted">
                      Dołączono: {formatDate(item.joinedAt)} | Zakończono: {item.current ? "—" : formatDate(item.leftAt)}
                    </div>

                    <div className="muted">
                      Status zespołu: {item.teamStatus || "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}