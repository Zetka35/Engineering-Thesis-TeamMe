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
import OnboardingSurvey from "./pages/OnboardingSurvey";
import Survey from "./pages/Survey";
import Profile from "./pages/Profile";
import TeamDetails from "./pages/TeamDetails";
import Network from "./pages/Network";
import PublicProfile from "./pages/PublicProfile";
import TeamSearch from "./pages/TeamSearch";
import PublicTeamDetails from "./pages/PublicTeamDetails";
import Messages from "./pages/Messages";
import History from "./pages/History";

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Ładowanie…</div>;
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
            <Route path="/teams/:teamId" element={<TeamDetails />} />
            <Route path="/teams/public/:teamId" element={<PublicTeamDetails />} />

            <Route path="/dashboard" element={<Placeholder title="Strona główna" />} />
            <Route path="/tasks" element={<Placeholder title="Zadania" />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/team-search" element={<TeamSearch />} />
            <Route path="/history" element={<History />} />
            <Route path="/team-requests" element={<Navigate to="/messages" replace />} />

            <Route path="/network" element={<Network />} />
            <Route path="/network/:username" element={<PublicProfile />} />

            <Route path="/onboarding" element={<OnboardingSurvey />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/profile" element={<Profile />} />

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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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