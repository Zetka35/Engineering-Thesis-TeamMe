import React from "react";
import type { RoleRequirementDraft } from "./TeamForm.tsx";

type Props = {
  items: RoleRequirementDraft[];
  onChange: (items: RoleRequirementDraft[]) => void;
  title?: string;
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
          Dodaj rolę
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((roleRequirement, index) => (
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
                  onChange={(e) => updateItem(index, { roleName: e.target.value })}
                  placeholder="Np. Backend Developer"
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
                    updateItem(index, {
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
                    updateItem(index, {
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

              <button type="button" className="btn btn-ghost" onClick={() => removeItem(index)}>
                Usuń
              </button>
            </div>

            <div>
              <label><b>Opis roli</b></label>
              <textarea
                className="input"
                rows={3}
                value={roleRequirement.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Krótko opisz oczekiwania wobec tej roli."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}