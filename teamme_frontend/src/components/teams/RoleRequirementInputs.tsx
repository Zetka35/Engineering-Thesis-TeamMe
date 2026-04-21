import React from "react";
import type { RoleRequirementDraft } from "./TeamForm";
import { ROLE_ORDER } from "../../survey/teamRoleSurvey";

type Props = {
  items: RoleRequirementDraft[];
  onChange: (items: RoleRequirementDraft[]) => void;
  title?: string;
  subtitle?: string;
};

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

export default function RoleRequirementInputs({
  items,
  onChange,
  title = "Poszukiwane role",
  subtitle = "",
}: Props) {
  function updateItem(index: number, patch: Partial<RoleRequirementDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, emptyRoleRequirement()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      onChange([emptyRoleRequirement()]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="form-section">
      <div className="form-section-header">
        <div>
          <h4 className="form-section-title">{title}</h4>
          {subtitle ? <p className="form-section-subtitle">{subtitle}</p> : null}
        </div>

        <button type="button" className="btn btn-ghost" onClick={addItem}>
          Dodaj rolę
        </button>
      </div>

      <div className="form-inline-note">
        Każda pozycja rekrutacyjna ma dwa poziomy:
        <b> rolę projektową</b> oraz <b>preferowany styl współpracy zespołowej</b>.
      </div>

      <div className="form-grid">
        {items.map((roleRequirement, index) => (
          <div key={`role-${index}`} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">Rola {index + 1}</div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeItem(index)}
              >
                Usuń
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div className="field">
                <label className="field-label">Rola projektowa</label>
                <input
                  className="input"
                  value={roleRequirement.projectRoleName}
                  onChange={(e) => updateItem(index, { projectRoleName: e.target.value })}
                  placeholder="Np. Frontend Developer, UX Designer, Tester"
                />
                <p className="field-help">
                  To rola funkcjonalna, związana z zadaniami i odpowiedzialnością w projekcie.
                </p>
              </div>

              <div className="field">
                <label className="field-label">Liczba miejsc</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={20}
                  value={roleRequirement.slots}
                  onChange={(e) =>
                    updateItem(index, {
                      slots: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="field">
                <label className="field-label">Priorytet</label>
                <select
                  className="input"
                  value={roleRequirement.priority}
                  onChange={(e) =>
                    updateItem(index, {
                      priority: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                >
                  <option value="1">1 — niski</option>
                  <option value="2">2</option>
                  <option value="3">3 — średni</option>
                  <option value="4">4</option>
                  <option value="5">5 — bardzo wysoki</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div className="field">
                <label className="field-label">Preferowana rola zespołowa</label>
                <select
                  className="input"
                  value={roleRequirement.preferredTeamRole}
                  onChange={(e) =>
                    updateItem(index, { preferredTeamRole: e.target.value })
                  }
                >
                  <option value="">Bez preferencji</option>
                  {ROLE_ORDER.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="field-help">
                  To Twoja autorska rola zespołowa — określa preferowany styl współpracy, a nie kompetencje techniczne.
                </p>
              </div>

              <div className="field">
                <label className="field-label">Ważność roli zespołowej</label>
                <select
                  className="input"
                  value={roleRequirement.teamRoleImportance}
                  onChange={(e) =>
                    updateItem(index, {
                      teamRoleImportance:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                >
                  <option value="1">1 — mało ważne</option>
                  <option value="2">2</option>
                  <option value="3">3 — umiarkowanie ważne</option>
                  <option value="4">4</option>
                  <option value="5">5 — bardzo ważne</option>
                </select>
                <p className="field-help">
                  Ustaw wyżej, jeśli sposób współpracy jest w tej roli szczególnie istotny.
                </p>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Opis odpowiedzialności</label>
              <textarea
                className="input"
                rows={3}
                value={roleRequirement.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Np. odpowiedzialność za logikę backendu, integrację API i porządkowanie architektury."
              />
              <p className="field-help">
                Opisz nie tylko zadania techniczne, ale też oczekiwany sposób działania w zespole.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}