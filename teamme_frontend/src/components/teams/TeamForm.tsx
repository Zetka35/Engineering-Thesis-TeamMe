import React, { useEffect, useState } from "react";
import type { TeamExperienceLevel, TeamRecruitmentStatus } from "../../models/Team";
import TechnologyInputs from "./TechnologyInputs";
import RoleRequirementInputs from "./RoleRequirementInputs";

export type TechnologyDraft = {
  name: string;
  requiredLevel: number | "";
  required: boolean;
};

export type RoleRequirementDraft = {
  roleName: string;
  slots: number | "";
  description: string;
  priority: number | "";
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
};

type Props = {
  title?: string;
  submitLabel: string;
  initialValue?: Partial<TeamFormValue>;
  saving?: boolean;
  onSubmit: (value: TeamFormValue) => void | Promise<void>;
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

function buildInitialValue(initialValue?: Partial<TeamFormValue>): TeamFormValue {
  return {
    name: initialValue?.name ?? "",
    description: initialValue?.description ?? "",
    expectedTimeText: initialValue?.expectedTimeText ?? "",
    maxMembers: initialValue?.maxMembers ?? 4,
    projectArea: initialValue?.projectArea ?? "",
    experienceLevel: initialValue?.experienceLevel ?? "MIXED",
    recruitmentStatus: initialValue?.recruitmentStatus ?? "OPEN",
    technologies:
      initialValue?.technologies && initialValue.technologies.length
        ? initialValue.technologies
        : [emptyTechnology()],
    roleRequirements:
      initialValue?.roleRequirements && initialValue.roleRequirements.length
        ? initialValue.roleRequirements
        : [emptyRoleRequirement()],
  };
}

export default function TeamForm({
  title = "Formularz zespołu",
  submitLabel,
  initialValue,
  saving = false,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TeamFormValue>(buildInitialValue(initialValue));

  useEffect(() => {
    setForm(buildInitialValue(initialValue));
  }, [initialValue]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className="profile-block">
      <div className="profile-block-title">{title}</div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
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
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label><b>Obszar projektu</b></label>
            <input
              className="input"
              value={form.projectArea}
              onChange={(e) => setForm((prev) => ({ ...prev, projectArea: e.target.value }))}
              placeholder="Np. EdTech / AI / Marketplace"
            />
          </div>
        </div>

        <div>
          <label><b>Opis</b></label>
          <textarea
            className="input"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
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
              value={form.expectedTimeText}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedTimeText: e.target.value }))}
            />
          </div>

          <div>
            <label><b>Liczba miejsc</b></label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.maxMembers}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, maxMembers: Number(e.target.value) }))
              }
              required
            />
          </div>

          <div>
            <label><b>Poziom doświadczenia</b></label>
            <select
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
          </div>

          <div>
            <label><b>Status rekrutacji</b></label>
            <select
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
          </div>
        </div>

        <TechnologyInputs
          items={form.technologies}
          onChange={(items) => setForm((prev) => ({ ...prev, technologies: items }))}
        />

        <RoleRequirementInputs
          items={form.roleRequirements}
          onChange={(items) => setForm((prev) => ({ ...prev, roleRequirements: items }))}
        />

        <div>
          <button className="btn btn-solid" disabled={saving}>
            {saving ? "Zapisywanie…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}