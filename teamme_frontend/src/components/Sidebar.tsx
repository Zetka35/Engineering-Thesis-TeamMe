import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  user: { username: string } | null;
  setUser: (user: { username: string } | null) => void;
}

export default function Sidebar({ user, setUser }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <h2>Team Me</h2>
      <ul>
        <li className={isActive("/") ? "active" : ""}>
          <Link to="/">Strona główna</Link>
        </li>

        {user ? (
          <>
            <li className={isActive("/teams") ? "active" : ""}>
              <Link to="/teams">Moje zespoły</Link>
            </li>
            <li className={isActive("/search") ? "active" : ""}>
              <Link to="/search">Szukaj zespołu</Link>
            </li>
            <li className={isActive("/profile") ? "active" : ""}>
              <Link to="/profile">Profil</Link>
            </li>
            <li>
              <button onClick={handleLogout} style={{ cursor: "pointer" }}>
                Wyloguj
              </button>
            </li>
          </>
        ) : (
          <>
            <li className={isActive("/login") ? "active" : ""}>
              <Link to="/login">Logowanie</Link>
            </li>
            <li className={isActive("/register") ? "active" : ""}>
              <Link to="/register">Rejestracja</Link>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
