import React from "react";
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

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          <Routes>
            <Route path="/teams" element={<Teams />} />
            <Route path="/dashboard" element={<Placeholder title="Strona główna" />} />
            <Route path="/tasks" element={<Placeholder title="Zadania" />} />
            <Route path="/messages" element={<Placeholder title="Skrzynka wiadomości" />} />
            <Route path="/team-search" element={<Placeholder title="Szukaj zespołu" />} />
            <Route path="/history" element={<Placeholder title="Historia pracy" />} />
            <Route path="/workspace" element={<Placeholder title="Przestrzeń robocza" />} />
            <Route path="/network" element={<Placeholder title="Nawiązywanie kontaktów" />} />
            <Route path="/profile" element={<Placeholder title="Profil" />} />
            <Route path="*" element={<Navigate to="/teams" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route
            path="/*"
            element={
              <ProtectedShell>
                <AppShell />
              </ProtectedShell>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}