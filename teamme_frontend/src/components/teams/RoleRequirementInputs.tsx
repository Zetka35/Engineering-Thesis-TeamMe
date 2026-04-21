import React from "react";
import type { RoleRequirementDraft } from "./TeamForm";

type Props = {
  items: RoleRequirementDraft[];
  onChange: (items: RoleRequirementDraft[]) => void;
  title?: string;
  subtitle?: string;
};

function emptyRoleRequirement(): RoleRequirementDraft {
  return {
    roleName: "",
    slots: 1,
    description: "",
    priority: 3,
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
        Opisuj role prostym językiem. Kandydat powinien szybko zrozumieć,
        kogo szukacie i czego będzie dotyczyć jego praca.
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
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              <div className="field">
                <label className="field-label">
                  Nazwa roli
                </label>
                <input
                  className="input"
                  value={roleRequirement.roleName}
                  onChange={(e) => updateItem(index, { roleName: e.target.value })}
                  placeholder="Np. Frontend Developer"
                />
                <p className="field-help">
                  Podaj nazwę roli tak, jak zobaczy ją kandydat.
                </p>
              </div>

              <div className="field">
                <label className="field-label">
                  Liczba miejsc
                </label>
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
                <p className="field-help">
                  Ile osób chcesz pozyskać do tej roli.
                </p>
              </div>

              <div className="field">
                <label className="field-label">
                  Priorytet
                </label>
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
                <p className="field-help">
                  Wyższy priorytet oznacza ważniejszą rolę dla rekrutacji.
                </p>
              </div>
            </div>

            <div className="field">
              <label className="field-label">
                Krótki opis roli
              </label>
              <textarea
                className="input"
                rows={3}
                value={roleRequirement.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Np. osoba odpowiedzialna za logikę backendu, integrację API i model danych."
              />
              <p className="field-help">
                Napisz krótko, za co będzie odpowiadać ta osoba.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}