import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Uzupełnij login i hasło.");
      return;
    }

    setBusy(true);
    try {
      await login(username.trim(), password);
      nav("/profile");
    } catch (e: any) {
  setError(e?.message ?? "Wystąpił błąd logowania");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="auth-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="auth-title">Logowanie</h1>
          <p className="auth-subtitle">Zaloguj się, aby przejść do panelu.</p>

          <label className="field">
            <span>Login</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="np. admin" />
          </label>

          <label className="field">
            <span>Hasło</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
            />
          </label>

          {error && (
  <div className="alert">
    {(() => {
      try {
        const parsed = JSON.parse(error) as { message?: string };
        return parsed?.message ?? error;
      } catch {
        return error;
      }
    })()}
  </div>
)}

          <button className="btn btn-solid btn-wide" disabled={busy} type="submit">
            {busy ? "Logowanie…" : "Zaloguj"}
          </button>

          <p className="auth-footer">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </p>

          <p className="auth-hint">
            Konto testowe: <b>admin / admin</b>
          </p>
        </form>
      </main>
    </div>
  );
}