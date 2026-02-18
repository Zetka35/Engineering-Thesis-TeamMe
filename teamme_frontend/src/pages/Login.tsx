import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";

interface LoginProps {
  setUser: (user: { username: string } | null) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const user = await login(username, password);
    if (user) {
      setUser(user);            // ustawiamy zalogowanego usera
      navigate("/teams");       // przenosimy na stronę Zespołów
    } else {
      setError("Błędne dane logowania");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Logowanie</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      /><br/>
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      /><br/>
      <button onClick={handleLogin}>Zaloguj</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
