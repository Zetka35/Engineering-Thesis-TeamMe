import React, { useState } from "react";
import { register } from "../api/auth.api";

interface RegisterProps {
  setUser: (user: { username: string } | null) => void;
}

export default function Register({ setUser }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    const user = await register({ username, password, firstName, lastName, email });
    setUser(user);  // po rejestracji automatycznie zalogowany
    setMessage(`Zarejestrowano użytkownika: ${user.username}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Rejestracja</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br/>
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br/>
      <input placeholder="Imię" value={firstName} onChange={e => setFirstName(e.target.value)} /><br/>
      <input placeholder="Nazwisko" value={lastName} onChange={e => setLastName(e.target.value)} /><br/>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br/>
      <button onClick={handleRegister}>Zarejestruj</button>
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}
