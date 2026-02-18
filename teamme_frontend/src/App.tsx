import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Teams from "./pages/Teams";
import "./App.css";

interface User {
  username: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar user={user} setUser={setUser} />
        <div className="main">
          {user && <Topbar user={user} onLogout={() => setUser(null)} />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/teams" element={<Teams />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
