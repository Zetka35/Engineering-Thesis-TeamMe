import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { useAuth } from "../auth/AuthContext";
export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Uzupełnij login i hasło.");
            return;
        }
        setBusy(true);
        try {
            await login(username.trim(), password);
            nav("/teams");
        }
        catch (err) {
            setError(err?.message ?? "Nie udało się zalogować.");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "public-page", children: [_jsx(PublicNavbar, {}), _jsx("main", { className: "auth-wrap", children: _jsxs("form", { className: "auth-card", onSubmit: handleSubmit, children: [_jsx("h1", { className: "auth-title", children: "Logowanie" }), _jsx("p", { className: "auth-subtitle", children: "Zaloguj si\u0119, aby przej\u015B\u0107 do panelu." }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Login" }), _jsx("input", { value: username, onChange: (e) => setUsername(e.target.value), placeholder: "np. admin" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Has\u0142o" }), _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" })] }), error && _jsx("div", { className: "alert", children: error }), _jsx("button", { className: "btn btn-solid btn-wide", disabled: busy, type: "submit", children: busy ? "Logowanie…" : "Zaloguj" }), _jsxs("p", { className: "auth-footer", children: ["Nie masz konta? ", _jsx(Link, { to: "/register", children: "Zarejestruj si\u0119" })] }), _jsxs("p", { className: "auth-hint", children: ["Konto testowe: ", _jsx("b", { children: "admin / admin" })] })] }) })] }));
}
