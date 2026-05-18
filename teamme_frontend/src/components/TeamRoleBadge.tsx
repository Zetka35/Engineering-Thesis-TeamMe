import React from "react";

type Props = {
  role?: string | null;
};

const ROLE_STYLES: Record<string, { background: string; border: string; color: string }> = {
  "Koordynator Relacji": {
    background: "#eff6ff",
    border: "#93c5fd",
    color: "#1e40af",
  },
  "Realizator Zadań": {
    background: "#ecfdf3",
    border: "#86efac",
    color: "#166534",
  },
  "Inicjator Pomysłów": {
    background: "#f5f3ff",
    border: "#c4b5fd",
    color: "#5b21b6",
  },
  "Kontroler Jakości": {
    background: "#fff7ed",
    border: "#fdba74",
    color: "#9a3412",
  },
  "Analityk Strategiczny": {
    background: "#f1f5f9",
    border: "#94a3b8",
    color: "#334155",
  },
};

export default function TeamRoleBadge({ role }: Props) {
  if (!role) return null;

  const style = ROLE_STYLES[role] ?? {
    background: "#f8fafc",
    border: "#cbd5e1",
    color: "#334155",
  };

  return (
    <span
      className="team-role-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontWeight: 900,
      }}
    >
      {role}
    </span>
  );
}