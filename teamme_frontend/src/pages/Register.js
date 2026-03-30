import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { useAuth } from "../auth/AuthContext";
export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Uzupełnij login i hasło.");
            return;
        }
        if (password.length < 4) {
            setError("Hasło powinno mieć co najmniej 4 znaki.");
            return;
        }
        if (password !== password2) {
            setError("Hasła nie są takie same.");
            return;
        }
        setBusy(true);
        try {
            await register(username.trim(), password);
            nav("/onboarding");
        }
        catch (err) {
            setError(err?.message ?? "Nie udało się zarejestrować.");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "public-page", children: [_jsx(PublicNavbar, {}), _jsx("main", { className: "auth-wrap", children: _jsxs("form", { className: "auth-card", onSubmit: handleSubmit, children: [_jsx("h1", { className: "auth-title", children: "Rejestracja" }), _jsx("p", { className: "auth-subtitle", children: "Utw\u00F3rz konto w TeamMe." }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Login" }), _jsx("input", { value: username, onChange: (e) => setUsername(e.target.value), placeholder: "np. zosia" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Has\u0142o" }), _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), type: "password" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Powt\u00F3rz has\u0142o" }), _jsx("input", { value: password2, onChange: (e) => setPassword2(e.target.value), type: "password" })] }), error && _jsx("div", { className: "alert", children: error }), _jsx("button", { className: "btn btn-solid btn-wide", disabled: busy, type: "submit", children: busy ? "Tworzenie konta…" : "Utwórz konto" }), _jsxs("p", { className: "auth-footer", children: ["Masz konto? ", _jsx(Link, { to: "/login", children: "Zaloguj si\u0119" })] })] }) })] }));
}
