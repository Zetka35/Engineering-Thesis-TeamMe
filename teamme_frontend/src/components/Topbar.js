import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GearIcon, GridIcon, IconButton, SearchIcon } from "./icons";
function useOutsideClick(ref, onOutside) {
    useEffect(() => {
        function onDown(e) {
            const el = ref.current;
            if (!el)
                return;
            if (e.target instanceof Node && !el.contains(e.target))
                onOutside();
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [ref, onOutside]);
}
async function fileToDataUrl(file) {
    // proste zabezpieczenie – limit 2MB
    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Plik jest za duży. Maksymalnie 2MB.");
    }
    if (!file.type.startsWith("image/")) {
        throw new Error("Wybierz plik graficzny (png/jpg/webp).");
    }
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}
export default function Topbar() {
    const { user, logout, updateAvatar } = useAuth();
    const nav = useNavigate();
    const [q, setQ] = useState("");
    // dropdowny
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [appsOpen, setAppsOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const settingsRef = useRef(null);
    const appsRef = useRef(null);
    const avatarRef = useRef(null);
    const closeAvatarTimer = useRef(null);
    function openAvatarMenu() {
        if (closeAvatarTimer.current) {
            window.clearTimeout(closeAvatarTimer.current);
            closeAvatarTimer.current = null;
        }
        setAvatarOpen(true);
    }
    function scheduleCloseAvatarMenu() {
        if (closeAvatarTimer.current)
            window.clearTimeout(closeAvatarTimer.current);
        closeAvatarTimer.current = window.setTimeout(() => {
            setAvatarOpen(false);
            closeAvatarTimer.current = null;
        }, 350); // <- czas zamknięcia (ms). Zwiększ np. do 600
    }
    function useOutsideClick(ref, onOutside) {
        React.useEffect(() => {
            function onDown(e) {
                const el = ref.current;
                if (!el)
                    return;
                if (e.target instanceof Node && !el.contains(e.target))
                    onOutside();
            }
            document.addEventListener("mousedown", onDown);
            return () => document.removeEventListener("mousedown", onDown);
        }, [ref, onOutside]);
    }
    useOutsideClick(settingsRef, () => setSettingsOpen(false));
    useOutsideClick(appsRef, () => setAppsOpen(false));
    useOutsideClick(avatarRef, () => setAvatarOpen(false));
    const fileInputRef = useRef(null);
    const initials = useMemo(() => {
        const u = user?.username ?? "";
        return u.slice(0, 2).toUpperCase() || "U";
    }, [user]);
    const avatarStyle = useMemo(() => {
        if (!user?.avatarDataUrl)
            return undefined;
        return { backgroundImage: `url(${user.avatarDataUrl})` };
    }, [user?.avatarDataUrl]);
    function handleLogout() {
        logout();
        nav("/login");
    }
    async function onAvatarFilePicked(e) {
        try {
            const file = e.target.files?.[0];
            if (!file)
                return;
            const dataUrl = await fileToDataUrl(file);
            updateAvatar(dataUrl);
            setAvatarOpen(false);
        }
        catch (err) {
            alert(err?.message ?? "Nie udało się ustawić zdjęcia.");
        }
        finally {
            // pozwala wybrać ten sam plik ponownie
            e.target.value = "";
        }
    }
    function triggerAvatarUpload() {
        fileInputRef.current?.click();
    }
    return (_jsxs("header", { className: "topbar", children: [_jsx("div", { className: "topbar-left", children: _jsxs("div", { className: "topbar-search", children: [_jsx("span", { className: "topbar-search-icon", children: _jsx(SearchIcon, {}) }), _jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Szukaj...", "aria-label": "Szukaj" })] }) }), _jsxs("div", { className: "topbar-right", children: [_jsxs("div", { className: "dropdown", ref: settingsRef, children: [_jsx(IconButton, { title: "Ustawienia", onClick: () => {
                                    setSettingsOpen((v) => !v);
                                    setAppsOpen(false);
                                    setAvatarOpen(false);
                                }, children: _jsx(GearIcon, {}) }), settingsOpen && (_jsxs("div", { className: "dropdown-menu", role: "menu", "aria-label": "Ustawienia", children: [_jsx("button", { className: "menu-item", type: "button", onClick: () => alert("Profil – w przygotowaniu"), children: "Profil i konto" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => alert("Preferencje – w przygotowaniu"), children: "Preferencje (j\u0119zyk / motyw)" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => alert("Powiadomienia – w przygotowaniu"), children: "Powiadomienia" }), _jsx("div", { className: "menu-sep" }), _jsx("button", { className: "menu-item danger", type: "button", onClick: handleLogout, children: "Wyloguj" })] }))] }), _jsxs("div", { className: "dropdown", ref: appsRef, children: [_jsx(IconButton, { title: "Aplikacje", onClick: () => {
                                    setAppsOpen((v) => !v);
                                    setSettingsOpen(false);
                                    setAvatarOpen(false);
                                }, children: _jsx(GridIcon, {}) }), appsOpen && (_jsxs("div", { className: "dropdown-menu", role: "menu", "aria-label": "Aplikacje", children: [_jsx("button", { className: "menu-item", type: "button", onClick: () => nav("/teams"), children: "Moje zespo\u0142y" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => nav("/tasks"), children: "Zadania" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => nav("/messages"), children: "Wiadomo\u015Bci" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => nav("/workspace"), children: "Przestrze\u0144 robocza" })] }))] }), _jsxs("div", { className: "avatar-wrap", ref: avatarRef, onMouseEnter: openAvatarMenu, onMouseLeave: scheduleCloseAvatarMenu, children: [_jsx("div", { className: `avatar ${user?.avatarDataUrl ? "has-photo" : ""}`, style: avatarStyle, title: user?.username ? `Zalogowano: ${user.username}` : "Konto", onClick: () => {
                                    setAvatarOpen((v) => !v);
                                    setSettingsOpen(false);
                                    setAppsOpen(false);
                                }, role: "button", tabIndex: 0, children: !user?.avatarDataUrl && initials }), avatarOpen && (_jsxs("div", { className: "dropdown-menu avatar-menu", role: "menu", "aria-label": "Konto", onMouseEnter: openAvatarMenu, onMouseLeave: scheduleCloseAvatarMenu, children: [_jsxs("div", { className: "menu-header", children: [_jsx("div", { className: "menu-title", children: user?.username ?? "Użytkownik" }), _jsx("div", { className: "menu-sub", children: "Zarz\u0105dzanie profilem" })] }), _jsx("button", { className: "menu-item", type: "button", onClick: triggerAvatarUpload, children: "Zmie\u0144 zdj\u0119cie profilowe" }), _jsx("button", { className: "menu-item", type: "button", onClick: () => updateAvatar(undefined), children: "Usu\u0144 zdj\u0119cie" }), _jsx("div", { className: "menu-sep" }), _jsx("button", { className: "menu-item danger", type: "button", onClick: handleLogout, children: "Wyloguj" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/png,image/jpeg,image/webp", style: { display: "none" }, onChange: onAvatarFilePicked })] })] })] }));
}
