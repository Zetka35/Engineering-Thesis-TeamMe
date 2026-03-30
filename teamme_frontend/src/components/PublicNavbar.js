import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink } from "react-router-dom";
import { TeamMeLogo } from "./icons";
export default function PublicNavbar() {
    return (_jsx("header", { className: "public-topbar", children: _jsxs("div", { className: "public-topbar-inner", children: [_jsx(Link, { to: "/", className: "public-brand", children: _jsx(TeamMeLogo, {}) }), _jsxs("nav", { className: "public-nav", "aria-label": "Nawigacja", children: [_jsx("a", { className: "public-link", href: "#onas", children: "O NAS" }), _jsx("a", { className: "public-link", href: "#kontakt", children: "KONTAKT" }), _jsx("a", { className: "public-link", href: "#role", children: "ROLE ZESPO\u0141OWE" })] }), _jsxs("div", { className: "public-actions", children: [_jsx(NavLink, { to: "/register", className: "btn btn-ghost", children: "Do\u0142\u0105cz teraz" }), _jsx(NavLink, { to: "/login", className: "btn btn-solid", children: "Zaloguj si\u0119" })] })] }) }));
}
