import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { TeamMeLogo } from "./icons";
const items = [
    { to: "/dashboard", label: "Strona główna" },
    { to: "/tasks", label: "Zadania" },
    { to: "/messages", label: "Skrzynka wiadomości" },
    { to: "/team-search", label: "Szukaj zespołu" },
    { to: "/network", label: "Nawiązywanie kontaktów" },
    { to: "/teams", label: "Moje zespoły" },
    { to: "/history", label: "Historia pracy" },
    { to: "/workspace", label: "Przestrzeń robocza" },
    { to: "/profile", label: "Profil" },
];
export default function Sidebar() {
    return (_jsxs("aside", { className: "sidebar", children: [_jsx("div", { className: "sidebar-brand", children: _jsx("div", { className: "sidebar-brand-box", children: _jsx("div", { className: "sidebar-brand-scale", children: _jsx(TeamMeLogo, {}) }) }) }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Menu boczne", children: items.map((it) => (_jsx(NavLink, { to: it.to, className: ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`, children: it.label }, it.to))) })] }));
}
