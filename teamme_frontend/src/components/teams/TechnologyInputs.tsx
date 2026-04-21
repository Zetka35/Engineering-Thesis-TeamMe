import React from "react";
import type { TechnologyDraft } from "./TeamForm.tsx";

type Props = {
  items: TechnologyDraft[];
  onChange: (items: TechnologyDraft[]) => void;
  title?: string;
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
          {title}
        </div>

        <button type="button" className="btn btn-ghost" onClick={addItem}>
          Dodaj technologię
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((technology, index) => (
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
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Np. React"
              />
            </div>

            <div>
              <label><b>Poziom</b></label>
              <select
                className="input"
                value={technology.requiredLevel}
                onChange={(e) =>
                  updateItem(index, {
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
                onChange={(e) => updateItem(index, { required: e.target.checked })}
              />
              Wymagana
            </label>

            <button type="button" className="btn btn-ghost" onClick={() => removeItem(index)}>
              Usuń
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}