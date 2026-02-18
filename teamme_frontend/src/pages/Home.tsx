import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Witaj w Team Me!</h1>
      <p>Prototyp frontendu.</p>
      <Link to="/login"><button>Logowanie</button></Link>
      <Link to="/register" style={{ marginLeft: "10px" }}><button>Rejestracja</button></Link>
    </div>
  );
}
