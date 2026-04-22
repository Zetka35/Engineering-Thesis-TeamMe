import React from "react";
import type { TechnologyDraft } from "./TeamForm";
import { TECHNOLOGY_GROUPS, isCatalogTechnology } from "../../data/technologyCatalog";

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
    mode: "catalog",
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
        Najpierw wybierz technologie kluczowe dla projektu. Jeśli czegoś nie ma na liście, możesz dodać własną pozycję.
      </div>

      <div className="form-grid">
        {items.map((technology, index) => {
          const mode =
            technology.mode ??
            (isCatalogTechnology(technology.name) ? "catalog" : "custom");

          return (
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

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={mode === "catalog" ? "btn btn-solid" : "btn btn-ghost"}
                  onClick={() =>
                    updateItem(index, {
                      mode: "catalog",
                      name: isCatalogTechnology(technology.name) ? technology.name : "",
                    })
                  }
                >
                  Wybierz z listy
                </button>

                <button
                  type="button"
                  className={mode === "custom" ? "btn btn-solid" : "btn btn-ghost"}
                  onClick={() =>
                    updateItem(index, {
                      mode: "custom",
                      name: isCatalogTechnology(technology.name) ? "" : technology.name,
                    })
                  }
                >
                  Dodaj własną
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
                  <label className="field-label">Technologia</label>

                  {mode === "catalog" ? (
                    <select
                      className="input"
                      value={isCatalogTechnology(technology.name) ? technology.name : ""}
                      onChange={(e) =>
                        updateItem(index, {
                          name: e.target.value,
                          mode: "catalog",
                        })
                      }
                    >
                      <option value="">Wybierz technologię</option>
                      {TECHNOLOGY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      value={technology.name}
                      onChange={(e) =>
                        updateItem(index, {
                          name: e.target.value,
                          mode: "custom",
                        })
                      }
                      placeholder="Np. LangChain, Supabase, Unity, Blender"
                    />
                  )}

                  <p className="field-help">
                    {mode === "catalog"
                      ? "Wybierz z gotowej listy najczęściej używanych technologii."
                      : "Wpisz własną technologię, jeśli nie ma jej w katalogu."}
                  </p>
                </div>

                <div className="field">
                  <label className="field-label">Oczekiwany poziom</label>
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
          );
        })}
      </div>
    </div>
  );
}