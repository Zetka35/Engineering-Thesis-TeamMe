import React, { useState } from "react";
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
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
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
    } catch (err: any) {
      setError(err?.message ?? "Nie udało się zarejestrować.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="auth-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="auth-title">Rejestracja</h1>
          <p className="auth-subtitle">Utwórz konto w TeamMe.</p>

          <label className="field">
            <span>Login</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="np. zosia" />
          </label>

          <label className="field">
            <span>Hasło</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>

          <label className="field">
            <span>Powtórz hasło</span>
            <input value={password2} onChange={(e) => setPassword2(e.target.value)} type="password" />
          </label>

          {error && <div className="alert">{error}</div>}

          <button className="btn btn-solid btn-wide" disabled={busy} type="submit">
            {busy ? "Tworzenie konta…" : "Utwórz konto"}
          </button>

          <p className="auth-footer">
            Masz konto? <Link to="/login">Zaloguj się</Link>
          </p>
        </form>
      </main>
    </div>
  );
}