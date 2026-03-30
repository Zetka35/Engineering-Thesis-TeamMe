import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Teams from "./pages/Teams";
import Placeholder from "./pages/Placeholder";
import OnboardingSurvey from "./pages/OnboardingSurvey";
import Survey from "./pages/Survey";
import Profile from "./pages/Profile";
import TeamDetails from "./pages/TeamDetails";
function ProtectedShell({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx("div", { style: { padding: 20 }, children: "\u0141adowanie\u2026" });
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
function AppShell() {
    return (_jsxs("div", { className: "app-shell", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "app-main", children: [_jsx(Topbar, {}), _jsx("div", { className: "app-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/teams", element: _jsx(Teams, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Placeholder, { title: "Strona g\u0142\u00F3wna" }) }), _jsx(Route, { path: "/tasks", element: _jsx(Placeholder, { title: "Zadania" }) }), _jsx(Route, { path: "/messages", element: _jsx(Placeholder, { title: "Skrzynka wiadomo\u015Bci" }) }), _jsx(Route, { path: "/team-search", element: _jsx(Placeholder, { title: "Szukaj zespo\u0142u" }) }), _jsx(Route, { path: "/history", element: _jsx(Placeholder, { title: "Historia pracy" }) }), _jsx(Route, { path: "/workspace", element: _jsx(Placeholder, { title: "Przestrze\u0144 robocza" }) }), _jsx(Route, { path: "/network", element: _jsx(Placeholder, { title: "Nawi\u0105zywanie kontakt\u00F3w" }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/teams", replace: true }) }), _jsx(Route, { path: "/onboarding", element: _jsx(OnboardingSurvey, {}) }), _jsx(Route, { path: "/survey", element: _jsx(Survey, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/teams/:teamId", element: _jsx(TeamDetails, {}) })] }) })] })] }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/*", element: _jsx(ProtectedShell, { children: _jsx(AppShell, {}) }) })] }) }) }));
}
