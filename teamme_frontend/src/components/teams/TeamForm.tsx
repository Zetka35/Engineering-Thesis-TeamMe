import React, { useEffect, useRef, useState } from "react";
import type { TeamExperienceLevel, TeamRecruitmentStatus } from "../../models/Team";
import TechnologyInputs from "./TechnologyInputs";
import RoleRequirementInputs from "./RoleRequirementInputs";
import { isCatalogTechnology } from "../../data/technologyCatalog";

export type TechnologyDraft = {
  name: string;
  requiredLevel: number | "";
  required: boolean;
  mode?: "catalog" | "custom";
};

export type RoleRequirementDraft = {
  projectRoleName: string;
  slots: number | "";
  description: string;
  priority: number | "";
  preferredTeamRole: string;
  teamRoleImportance: number | "";
};

export type TeamFormValue = {
  name: string;
  description: string;
  expectedTimeText: string;
  maxMembers: number;
  projectArea: string;
  experienceLevel: TeamExperienceLevel;
  recruitmentStatus: TeamRecruitmentStatus;
  technologies: TechnologyDraft[];
  roleRequirements: RoleRequirementDraft[];
  showOnPublicProfile: boolean;
};

type Props = {
  title?: string;
  submitLabel: string;
  initialValue?: Partial<TeamFormValue>;
  saving?: boolean;
  onSubmit: (value: TeamFormValue) => void | Promise<void>;
  showVisibilityChoice?: boolean;
};

type FormErrors = Partial<
  Record<"name" | "description" | "projectArea" | "maxMembers" | "roleRequirements", string>
>;

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


const PROJECT_AREA_OPTIONS = [
  "Aplikacja webowa",
  "Aplikacja mobilna",
  "AI / ML",
  "Data / Analytics",
  "UX / UI",
  "E-commerce",
  "EdTech",
  "FinTech",
  "GameDev",
  "IoT",
  "SaaS / produkt cyfrowy",
  "Automatyzacja procesów",
] as const;


function isKnownProjectArea(value?: string | null) {
  if (!value) return false;
  return PROJECT_AREA_OPTIONS.some(
    (item) => item.trim().toLowerCase() === value.trim().toLowerCase()
  );
}

function deriveProjectAreaMode(value?: string | null): "catalog" | "custom" {
  if (!value) return "catalog";
  return isKnownProjectArea(value) ? "catalog" : "custom";
}

function emptyTechnology(): TechnologyDraft {
  return {
    name: "",
    requiredLevel: "",
    required: true,
    mode: "catalog",
  };
}

function emptyRoleRequirement(): RoleRequirementDraft {
  return {
    projectRoleName: "",
    slots: 1,
    description: "",
    priority: 3,
    preferredTeamRole: "",
    teamRoleImportance: 3,
  };
}

function buildInitialValue(initialValue?: Partial<TeamFormValue>): TeamFormValue {
  return {
    name: initialValue?.name ?? "",
    description: initialValue?.description ?? "",
    expectedTimeText: initialValue?.expectedTimeText ?? "",
    maxMembers: initialValue?.maxMembers ?? 4,
    projectArea: initialValue?.projectArea ?? "",
    experienceLevel: initialValue?.experienceLevel ?? "MIXED",
    recruitmentStatus: initialValue?.recruitmentStatus ?? "OPEN",
    showOnPublicProfile: initialValue?.showOnPublicProfile ?? true,
    technologies:
      initialValue?.technologies && initialValue.technologies.length
        ? initialValue.technologies.map((technology) => ({
            ...technology,
            mode:
              technology.mode ??
              (isCatalogTechnology(technology.name) ? "catalog" : "custom"),
          }))
        : [emptyTechnology()],
    roleRequirements:
      initialValue?.roleRequirements && initialValue.roleRequirements.length
        ? initialValue.roleRequirements
        : [emptyRoleRequirement()],
  };
}

function validateForm(form: TeamFormValue): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Podaj nazwę zespołu.";
  }

  if (!form.description.trim()) {
    errors.description = "Krótki opis projektu jest wymagany.";
  } else if (form.description.trim().length < 20) {
    errors.description = "Opis powinien mieć przynajmniej 20 znaków.";
  }

  if (!form.projectArea.trim()) {
    errors.projectArea = "Wybierz obszar projektu albo wpisz własny.";
  }

  if (!Number.isFinite(form.maxMembers) || form.maxMembers < 2) {
    errors.maxMembers = "Zespół musi mieć co najmniej 2 miejsca: dla właściciela oraz przynajmniej jednego członka.";
  }

  const hasAnyProjectRole = form.roleRequirements.some((role) =>
    role.projectRoleName.trim()
  );

  if (form.recruitmentStatus === "OPEN" && !hasAnyProjectRole) {
    errors.roleRequirements =
      "Jeśli rekrutacja jest otwarta, dodaj przynajmniej jedną rolę projektową.";
  }

  return errors;
}

export default function TeamForm({
  title = "Formularz zespołu",
  submitLabel,
  initialValue,
  saving = false,
  showVisibilityChoice = false,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TeamFormValue>(buildInitialValue(initialValue));
  const [errors, setErrors] = useState<FormErrors>({});
  const [showRecruitmentDetails, setShowRecruitmentDetails] = useState(Boolean(initialValue));
  const [projectAreaMode, setProjectAreaMode] = useState<"catalog" | "custom">(
    deriveProjectAreaMode(initialValue?.projectArea)
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const projectAreaSelectRef = useRef<HTMLSelectElement>(null);
  const customProjectAreaRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const maxMembersRef = useRef<HTMLInputElement>(null);
  const roleRequirementsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setForm(buildInitialValue(initialValue));
    setErrors({});
    setShowRecruitmentDetails(Boolean(initialValue));
    setProjectAreaMode(deriveProjectAreaMode(initialValue?.projectArea));
  }, [initialValue]);

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const ERROR_FIELD_ORDER: Array<keyof FormErrors> = [
  "name",
  "projectArea",
  "description",
  "maxMembers",
  "roleRequirements",
];

function getErrorTarget(field: keyof FormErrors): HTMLElement | null {
  switch (field) {
    case "name":
      return nameRef.current;
    case "projectArea":
      return projectAreaMode === "custom"
        ? customProjectAreaRef.current
        : projectAreaSelectRef.current;
    case "description":
      return descriptionRef.current;
    case "maxMembers":
      return maxMembersRef.current;
    case "roleRequirements":
      return roleRequirementsRef.current;
    default:
      return null;
  }
}

function scrollToFirstError(nextErrors: FormErrors) {
  const firstErrorField = ERROR_FIELD_ORDER.find((field) => nextErrors[field]);

  if (!firstErrorField) return;

  if (firstErrorField === "roleRequirements") {
    setShowRecruitmentDetails(true);
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const target = getErrorTarget(firstErrorField);

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      target.focus?.({ preventScroll: true });
    });
  });
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = validateForm(form);

if (Object.keys(nextErrors).length > 0) {
  setErrors(nextErrors);
  scrollToFirstError(nextErrors);
  return;
}

    await onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      projectArea: form.projectArea.trim(),
      expectedTimeText: form.expectedTimeText.trim(),
      showOnPublicProfile: form.showOnPublicProfile,
      technologies: form.technologies.map((technology) => ({
        ...technology,
        name: technology.name.trim(),
      })),
      roleRequirements: form.roleRequirements.map((role) => ({
        ...role,
        projectRoleName: role.projectRoleName.trim(),
        description: role.description.trim(),
        preferredTeamRole: role.preferredTeamRole.trim(),
      })),
    });
  }

  return (

    <div className="profile-block">
      <div className="profile-block-title">{title}</div>

      <form onSubmit={handleSubmit} className="section-spacer" noValidate>
        <section className="form-section">
          <div className="form-section-header">
            <div>
              <h3 className="form-section-title">Informacje podstawowe</h3>
              <p className="form-section-subtitle">
                Określ czego będzie dotyczył projekt i potrzebny skład zespołu.
              </p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="team-name">
                Nazwa zespołu <span className="field-required">*</span>
              </label>
              <input
                ref={nameRef}
                id="team-name"
                className={`input ${errors.name ? "input-error" : ""}`}
                value={form.name}
                onChange={(e) => {
                  clearError("name");
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                }}
                placeholder="Np. Product Builders"
                required
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="team-project-area">
                Obszar projektu <span className="field-required">*</span>
              </label>

              <select
                ref={projectAreaSelectRef}
                id="team-project-area"
                className={`input ${errors.projectArea ? "input-error" : ""}`}
                value={
                  projectAreaMode === "catalog"
                    ? isKnownProjectArea(form.projectArea)
                      ? form.projectArea
                      : ""
                    : "__custom__"
                }
                onChange={(e) => {
                  clearError("projectArea");

                  if (e.target.value === "__custom__") {
                    setProjectAreaMode("custom");
                    setForm((prev) => ({
                      ...prev,
                      projectArea: isKnownProjectArea(prev.projectArea) ? "" : prev.projectArea,
                    }));
                    return;
                  }

                  setProjectAreaMode("catalog");
                  setForm((prev) => ({
                    ...prev,
                    projectArea: e.target.value,
                  }));
                }}
              >
                <option value="">Wybierz obszar projektu</option>
                {PROJECT_AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="__custom__">Wpisz własny obszar…</option>
              </select>

              {projectAreaMode === "custom" && (
                <input
                  ref={customProjectAreaRef}
                  className={`input ${errors.projectArea ? "input-error" : ""}`}
                  value={form.projectArea}
                  onChange={(e) => {
                    clearError("projectArea");
                    setForm((prev) => ({ ...prev, projectArea: e.target.value }));
                  }}
                  placeholder="Np. system rekomendacji, platforma mentoringowa, system wspierający współpracę"
                  style={{ marginTop: 8 }}
                />
              )}

              <p className="field-help">
                Wybierz gotową kategorię albo wpisz własną.
              </p>
              {errors.projectArea && <p className="field-error">{errors.projectArea}</p>}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="team-description">
              Opis projektu <span className="field-required">*</span>
            </label>
            <textarea
              ref={descriptionRef}
              id="team-description"
              className={`input ${errors.description ? "input-error" : ""}`}
              rows={4}
              value={form.description}
              onChange={(e) => {
                clearError("description");
                setForm((prev) => ({ ...prev, description: e.target.value }));
              }}
              placeholder="Opisz co chcecie zbudować, na jakim etapie jesteście i jaki jest cel projektu."
              required
            />
            <p className="field-help">
              Cel projektu, etap prac i najważniejsze potrzeby zespołu.
            </p>
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="team-max-members">
                Liczba miejsc <span className="field-required">*</span>
              </label>
              <input
                ref={maxMembersRef}
                id="team-max-members"
                className={`input ${errors.maxMembers ? "input-error" : ""}`}
                type="number"
                min={2}
                step={1}
                max={50}
                value={form.maxMembers}
                onChange={(e) => {
                  clearError("maxMembers");
                  setForm((prev) => ({
                    ...prev,
                    maxMembers: Number(e.target.value),
                  }));
                }}
                required
              />
              <p className="field-help">
                Podaj maksymalną liczbę członków zespołu razem z właścicielem.
              </p>
              {errors.maxMembers && <p className="field-error">{errors.maxMembers}</p>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="team-time">
                Przewidywany czas zaangażowania
              </label>
              <input
                id="team-time"
                className="input"
                value={form.expectedTimeText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expectedTimeText: e.target.value }))
                }
                placeholder="Np. 5–7 h tygodniowo albo 2 spotkania w tygodniu"
              />
              <p className="field-help">
                To pole nie jest obowiązkowe, ale bardzo pomaga kandydatom ocenić dostępność.
              </p>
            </div>
          </div>

          {showVisibilityChoice && (
  <label className="checkbox-line">
    <input
      type="checkbox"
      checked={form.showOnPublicProfile}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          showOnPublicProfile: e.target.checked,
        }))
      }
    />
    <span>Pokaż ten projekt na moim profilu publicznym</span>
  </label>
)}

{showVisibilityChoice && (
  <p className="field-help">
    Jeśli wyłączysz tę opcję, projekt nie będzie widoczny na Twoim profilu publicznym,
    a oceny z tego projektu nie będą uwzględniane w publicznych średnich.
  </p>
)}

          <div className="form-inline-note">
            Krótki opis, wybrany obszar projektu, przynajmniej jedna rola projektowa
            i kilka technologii naprawdę istotnych dla rekrutacji.
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <div>
              <h3 className="form-section-title">Szczegóły rekrutacji i wymagania</h3>
              <p className="form-section-subtitle">
                Doprecyzuj wymagania projektowe i określ potrzeby zespołu. 
              </p>
            </div>

            <button
  type="button"
  className="btn btn-ghost form-toggle"
  onClick={() => setShowRecruitmentDetails((prev) => !prev)}
>
  {showRecruitmentDetails ? "Ukryj szczegóły rekrutacji" : "Pokaż szczegóły rekrutacji"}
</button>
          </div>

          {showRecruitmentDetails && (
            <>
              <div className="form-grid-3">
                <div className="field">
                  <label className="field-label" htmlFor="team-experience-level">
                    Poziom doświadczenia
                  </label>
                  <select
                    id="team-experience-level"
                    className="input"
                    value={form.experienceLevel}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        experienceLevel: e.target.value as TeamExperienceLevel,
                      }))
                    }
                  >
                    {experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-help">
                    Określ ogólny poziom kandydatów, których szukasz do projektu.
                  </p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="team-recruitment-status">
                    Status rekrutacji
                  </label>
                  <select
                    id="team-recruitment-status"
                    className="input"
                    value={form.recruitmentStatus}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        recruitmentStatus: e.target.value as TeamRecruitmentStatus,
                      }))
                    }
                  >
                    {recruitmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-help">
                    Zostaw „Otwarta”, jeśli chcesz od razu przyjmować aplikacje i wysyłać zaproszenia.
                  </p>
                </div>
              </div>

              <TechnologyInputs
                title="Technologie i umiejętności"
                subtitle="Wybierz z listy najważniejsze technologie projektu albo dodaj własne, jeśli nie ma ich w katalogu."
                items={form.technologies}
                onChange={(items) => setForm((prev) => ({ ...prev, technologies: items }))}
              />

              {errors.roleRequirements && (
  <div
    ref={roleRequirementsRef}
    className="alert alert-error"
    tabIndex={-1}
  >
    {errors.roleRequirements}
  </div>
)}

              <RoleRequirementInputs
  title="Poszukiwane role *"
  subtitle="Dodaj przynajmniej jedną rolę projektową. To pozwala kandydatom zrozumieć, kogo szukasz."
  items={form.roleRequirements}
  onChange={(items) => {
    clearError("roleRequirements");
    setForm((prev) => ({ ...prev, roleRequirements: items }));
  }}
/>
            </>
          )}
        </section>

        <div className="form-actions">
          <div className="form-actions-note">
            {initialValue
              ? "Po zapisaniu zmiany będą od razu widoczne w profilu zespołu."
              : "Po utworzeniu zespołu będzie można od razu wysyłać zaproszenia i uzupełniać szczegóły."}
          </div>

          <button className="btn btn-solid" disabled={saving}>
            {saving ? "Zapisywanie…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}