import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  TeamExperienceLevel,
  TeamRecruitmentStatus,
  TeamSummary,
} from "../models/Team";
import { createTeam, fetchTeams, searchTeams, type TeamUpsertPayload } from "../api/teams.api";

type TechnologyDraft = {
  name: string;
  requiredLevel: number | "";
  required: boolean;
};

type RoleRequirementDraft = {
  roleName: string;
  slots: number | "";
  description: string;
  priority: number | "";
};

const experienceOptions: Array<{ value: TeamExperienceLevel; label: string }> = [
  { value: "BEGINNER", label: "Początkujący" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
  { value: "MIXED", label: "Mieszany poziom" },
];

const recruitmentOptions: Array<{ value: TeamRecruitmentStatus; label: string }> = [
  { value: "OPEN", label: "Otwarta" },
  { value: "PAUSED", label: "Wstrzymana" },
  { value: "CLOSED", label: "Zamknięta" },
  { value: "FULL", label: "Komplet" },
];

function emptyTechnology(): TechnologyDraft {
  return {
    name: "",
    requiredLevel: "",
    required: true,
  };
}

function emptyRoleRequirement(): RoleRequirementDraft {
  return {
    roleName: "",
    slots: 1,
    description: "",
    priority: 3,
  };
}

function formatPl(iso?: string | null) {
  if (!iso) return "Brak terminu";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

function recruitmentLabel(value?: string | null) {
  switch (value) {
    case "OPEN":
      return "rekrutacja otwarta";
    case "PAUSED":
      return "rekrutacja wstrzymana";
    case "CLOSED":
      return "rekrutacja zamknięta";
    case "FULL":
      return "komplet";
    default:
      return value || "brak";
  }
}

function experienceLabel(value?: string | null) {
  switch (value) {
    case "BEGINNER":
      return "początkujący";
    case "JUNIOR":
      return "junior";
    case "MID":
      return "mid";
    case "SENIOR":
      return "senior";
    case "MIXED":
      return "mieszany";
    default:
      return value || "nie podano";
  }
}

export default function Teams() {
  const nav = useNavigate();

  const [myTeams, setMyTeams] = useState<TeamSummary[]>([]);
  const [openTeams, setOpenTeams] = useState<TeamSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedTimeText, setExpectedTimeText] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [projectArea, setProjectArea] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<TeamExperienceLevel>("MIXED");
  const [recruitmentStatus, setRecruitmentStatus] =
    useState<TeamRecruitmentStatus>("OPEN");

  const [technologies, setTechnologies] = useState<TechnologyDraft[]>([
    emptyTechnology(),
  ]);
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirementDraft[]>([
    emptyRoleRequirement(),
  ]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [myTeamsResult, openTeamsResult] = await Promise.all([
        fetchTeams(),
        searchTeams(),
      ]);

      setMyTeams(myTeamsResult ?? []);
      setOpenTeams(openTeamsResult ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się pobrać danych zespołów.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateTechnology(index: number, patch: Partial<TechnologyDraft>) {
    setTechnologies((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateRoleRequirement(index: number, patch: Partial<RoleRequirementDraft>) {
    setRoleRequirements((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  const visibleOpenTeams = useMemo(() => {
    const myIds = new Set(myTeams.map((team) => team.id));
    return openTeams.filter((team) => !myIds.has(team.id));
  }, [myTeams, openTeams]);

  function buildPayload(): TeamUpsertPayload {
    return {
      name,
      description,
      expectedTimeText,
      maxMembers,
      projectArea,
      experienceLevel,
      recruitmentStatus,
      technologies: technologies
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          requiredLevel: t.requiredLevel === "" ? null : t.requiredLevel,
          required: t.required,
        })),
      roleRequirements: roleRequirements
        .filter((r) => r.roleName.trim())
        .map((r) => ({
          roleName: r.roleName.trim(),
          slots: r.slots === "" ? 1 : Number(r.slots),
          description: r.description,
          priority: r.priority === "" ? 3 : Number(r.priority),
        })),
    };
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const created = await createTeam(buildPayload());

      setName("");
      setDescription("");
      setExpectedTimeText("");
      setMaxMembers(4);
      setProjectArea("");
      setExperienceLevel("MIXED");
      setRecruitmentStatus("OPEN");
      setTechnologies([emptyTechnology()]);
      setRoleRequirements([emptyRoleRequirement()]);

      setSuccessMsg("Zespół został utworzony.");
      nav(`/teams/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się utworzyć zespołu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Zespoły</h2>
          <p className="card-subtitle">
            Tworzenie, przeglądanie i przygotowywanie zespołów do rekrutacji projektowej.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
          {error && <div className="alert">{error}</div>}
          {successMsg && (
            <div
              className="alert"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

          <div className="profile-block">
            <div className="profile-block-title">Utwórz zespół</div>

            <form onSubmit={onCreate} style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                <div>
                  <label><b>Nazwa zespołu</b></label>
                  <input
                    className="input"
                    placeholder="Np. TeamMe Product Squad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label><b>Obszar projektu</b></label>
                  <input
                    className="input"
                    placeholder="Np. Aplikacja webowa / EdTech / AI"
                    value={projectArea}
                    onChange={(e) => setProjectArea(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>

              <div>
                <label><b>Opis zespołu / projektu</b></label>
                <textarea
                  className="input"
                  placeholder="Opisz cel projektu, kontekst i to, kogo szukasz."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div>
                  <label><b>Przewidywany czas zaangażowania</b></label>
                  <input
                    className="input"
                    placeholder="Np. 3 miesiące / 6h tygodniowo"
                    value={expectedTimeText}
                    onChange={(e) => setExpectedTimeText(e.target.value)}
                    maxLength={120}
                  />
                </div>

                <div>
                  <label><b>Liczba miejsc</b></label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={50}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label><b>Oczekiwany poziom doświadczenia</b></label>
                  <select
                    className="input"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as TeamExperienceLevel)}
                  >
                    {experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label><b>Status rekrutacji</b></label>
                  <select
                    className="input"
                    value={recruitmentStatus}
                    onChange={(e) =>
                      setRecruitmentStatus(e.target.value as TeamRecruitmentStatus)
                    }
                  >
                    {recruitmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-block" style={{ margin: 0 }}>
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
                    Wymagane technologie
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setTechnologies((prev) => [...prev, emptyTechnology()])}
                  >
                    Dodaj technologię
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {technologies.map((technology, index) => (
                    <div
                      key={`tech-${index}`}
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "2fr 1fr auto auto",
                        alignItems: "end",
                      }}
                    >
                      <div>
                        <label><b>Nazwa technologii</b></label>
                        <input
                          className="input"
                          value={technology.name}
                          onChange={(e) =>
                            updateTechnology(index, { name: e.target.value })
                          }
                          placeholder="Np. React"
                        />
                      </div>

                      <div>
                        <label><b>Poziom</b></label>
                        <select
                          className="input"
                          value={technology.requiredLevel}
                          onChange={(e) =>
                            updateTechnology(index, {
                              requiredLevel: e.target.value === "" ? "" : Number(e.target.value),
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

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          paddingBottom: 10,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={technology.required}
                          onChange={(e) =>
                            updateTechnology(index, { required: e.target.checked })
                          }
                        />
                        Wymagana
                      </label>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          setTechnologies((prev) =>
                            prev.length === 1 ? [emptyTechnology()] : prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-block" style={{ margin: 0 }}>
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
                    Poszukiwane role
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setRoleRequirements((prev) => [...prev, emptyRoleRequirement()])
                    }
                  >
                    Dodaj rolę
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {roleRequirements.map((roleRequirement, index) => (
                    <div
                      key={`role-${index}`}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        padding: 12,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "2fr 1fr 1fr auto",
                          alignItems: "end",
                        }}
                      >
                        <div>
                          <label><b>Rola</b></label>
                          <input
                            className="input"
                            value={roleRequirement.roleName}
                            onChange={(e) =>
                              updateRoleRequirement(index, { roleName: e.target.value })
                            }
                            placeholder="Np. Frontend Developer"
                          />
                        </div>

                        <div>
                          <label><b>Liczba miejsc</b></label>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            max={20}
                            value={roleRequirement.slots}
                            onChange={(e) =>
                              updateRoleRequirement(index, {
                                slots: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div>
                          <label><b>Priorytet</b></label>
                          <select
                            className="input"
                            value={roleRequirement.priority}
                            onChange={(e) =>
                              updateRoleRequirement(index, {
                                priority: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            setRoleRequirements((prev) =>
                              prev.length === 1
                                ? [emptyRoleRequirement()]
                                : prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Usuń
                        </button>
                      </div>

                      <div>
                        <label><b>Opis roli</b></label>
                        <textarea
                          className="input"
                          rows={3}
                          value={roleRequirement.description}
                          onChange={(e) =>
                            updateRoleRequirement(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Krótko opisz, czego oczekujesz od tej roli."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
            ) : myTeams.length === 0 ? (
              <div className="muted">Nie należysz jeszcze do żadnego zespołu.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {myTeams.map((team) => (
                  <div key={team.id} className="profile-block">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <button className="btn btn-ghost" onClick={() => nav(`/teams/${team.id}`)}>
                        Otwórz
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">moja rola: {team.myRole || "—"}</span>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
                      <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
                      <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
                      <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
                      <span className="pill">następne spotkanie: {formatPl(team.nextMeetingAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-block">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="profile-block-title" style={{ marginBottom: 0 }}>
                Otwarte zespoły
              </div>

              <button className="btn btn-ghost" onClick={() => nav("/team-search")}>
                Pełne wyszukiwanie
              </button>
            </div>

            {loading ? (
              <div className="muted">Ładowanie…</div>
            ) : visibleOpenTeams.length === 0 ? (
              <div className="muted">Brak innych otwartych zespołów.</div>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {visibleOpenTeams.map((team) => (
                  <div key={team.id} className="profile-block">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{team.name}</div>
                        <div className="muted">{team.description || "Brak opisu."}</div>
                      </div>

                      <button className="btn btn-ghost" onClick={() => nav(`/teams/${team.id}`)}>
                        Zobacz szczegóły
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className="pill">członkowie: {team.memberCount}/{team.maxMembers}</span>
                      <span className="pill">obszar: {team.projectArea || "nie podano"}</span>
                      <span className="pill">poziom: {experienceLabel(team.experienceLevel)}</span>
                      <span className="pill">{recruitmentLabel(team.recruitmentStatus)}</span>
                      <span className="pill">czas: {team.expectedTimeText || "nie podano"}</span>
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