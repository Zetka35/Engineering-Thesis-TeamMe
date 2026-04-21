import React from "react";
import type { TechnologyDraft } from "./TeamForm";

type Props = {
  items: TechnologyDraft[];
  onChange: (items: TechnologyDraft[]) => void;
  title?: string;
  subtitle?: string;
};

function emptyTechnology(): TechnologyDraft {
  return {
    name: "",
    requiredLevel: "",
    required: true,
  };
}

export default function TechnologyInputs({
  items,
  onChange,
  title = "Wymagane technologie",
  subtitle = "",
}: Props) {
  function updateItem(index: number, patch: Partial<TechnologyDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, emptyTechnology()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      onChange([emptyTechnology()]);
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
          Dodaj technologię
        </button>
      </div>

      <div className="form-inline-note">
        Dodaj tylko te technologie, które naprawdę mają znaczenie przy rekrutacji.
        Dzięki temu kandydaci dostaną bardziej czytelne wymagania.
      </div>

      <div className="form-grid">
        {items.map((technology, index) => (
          <div key={`tech-${index}`} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">Technologia {index + 1}</div>

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
                <label className="field-label">
                  Nazwa technologii
                </label>
                <input
                  className="input"
                  value={technology.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Np. React, Spring Boot, PostgreSQL, Figma"
                />
                <p className="field-help">
                  Wpisz konkretną technologię albo narzędzie.
                </p>
              </div>

              <div className="field">
                <label className="field-label">
                  Oczekiwany poziom
                </label>
                <select
                  className="input"
                  value={technology.requiredLevel}
                  onChange={(e) =>
                    updateItem(index, {
                      requiredLevel: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                >
                  <option value="">Nie określaj</option>
                  <option value="1">1 — podstawy</option>
                  <option value="2">2 — poziom podstawowy</option>
                  <option value="3">3 — poziom średni</option>
                  <option value="4">4 — poziom zaawansowany</option>
                  <option value="5">5 — ekspert</option>
                </select>
                <p className="field-help">
                  Możesz zostawić puste, jeśli liczy się sama znajomość technologii.
                </p>
              </div>
            </div>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={technology.required}
                onChange={(e) => updateItem(index, { required: e.target.checked })}
              />
              To wymaganie kluczowe
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}