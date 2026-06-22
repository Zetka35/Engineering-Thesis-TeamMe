type Props = {
  role?: string | null;
};

const ROLE_STYLES: Record<
  string,
  { background: string; border: string; color: string }
> = {
  "Koordynator Relacji": {
    background: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
  },
  "Realizator Zadań": {
    background: "#ecfdf5",
    border: "#bbf7d0",
    color: "#047857",
  },
  "Inicjator Pomysłów": {
    background: "#faf5ff",
    border: "#e9d5ff",
    color: "#7e22ce",
  },
  "Kontroler Jakości": {
    background: "#fff7ed",
    border: "#fed7aa",
    color: "#c2410c",
  },
  "Analityk Strategiczny": {
    background: "#f8fafc",
    border: "#cbd5e1",
    color: "#334155",
  },
  "Filar Wsparcia": {
    background: "#fdf2f8",
    border: "#fbcfe8",
    color: "#be185d",
  },
  "Łowca Informacji": {
    background: "#ecfeff",
    border: "#a5f3fc",
    color: "#0e7490",
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
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {role}
    </span>
  );
}