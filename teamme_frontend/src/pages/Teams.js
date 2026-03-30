import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam, fetchTeams } from "../api/teams.api";
function formatPl(iso) {
    if (!iso)
        return "Brak terminu";
    return new Date(iso).toLocaleString("pl-PL");
}
export default function Teams() {
    const nav = useNavigate();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [expectedTimeText, setExpectedTimeText] = useState("");
    const [maxMembers, setMaxMembers] = useState(4);
    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchTeams();
            setTeams(data);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się pobrać zespołów.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, []);
    async function onCreate(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const created = await createTeam({
                name,
                description,
                expectedTimeText,
                maxMembers,
            });
            setName("");
            setDescription("");
            setExpectedTimeText("");
            setMaxMembers(4);
            nav(`/teams/${created.id}`);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się utworzyć zespołu.");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: "Zespo\u0142y" }), _jsx("p", { className: "card-subtitle", children: "Tworzenie i przegl\u0105danie realnych zespo\u0142\u00F3w zapisanych w bazie." })] }), _jsxs("div", { className: "card-body", children: [error && _jsx("div", { className: "alert", children: error }), _jsxs("div", { className: "profile-block", style: { marginBottom: 16 }, children: [_jsx("div", { className: "profile-block-title", children: "Utw\u00F3rz zesp\u00F3\u0142" }), _jsxs("form", { onSubmit: onCreate, style: { display: "grid", gap: 12 }, children: [_jsx("input", { className: "input", placeholder: "Nazwa zespo\u0142u", value: name, onChange: (e) => setName(e.target.value), maxLength: 200, required: true }), _jsx("textarea", { className: "input", placeholder: "Opis zespo\u0142u", value: description, onChange: (e) => setDescription(e.target.value), rows: 4 }), _jsx("input", { className: "input", placeholder: "Przewidywany czas, np. 3 miesi\u0105ce / 5h tygodniowo", value: expectedTimeText, onChange: (e) => setExpectedTimeText(e.target.value), maxLength: 120 }), _jsx("input", { className: "input", type: "number", min: 1, max: 50, value: maxMembers, onChange: (e) => setMaxMembers(Number(e.target.value)), required: true }), _jsx("div", { children: _jsx("button", { className: "btn btn-solid", disabled: saving, type: "submit", children: saving ? "Tworzenie…" : "Utwórz zespół" }) })] })] }), _jsxs("div", { className: "profile-block", children: [_jsx("div", { className: "profile-block-title", children: "Moje zespo\u0142y" }), loading ? (_jsx("div", { className: "muted", children: "\u0141adowanie\u2026" })) : teams.length === 0 ? (_jsx("div", { className: "muted", children: "Nie nale\u017Cysz jeszcze do \u017Cadnego zespo\u0142u." })) : (_jsx("div", { style: { display: "grid", gap: 12 }, children: teams.map((team) => (_jsxs("div", { className: "profile-block", children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 800 }, children: team.name }), _jsx("div", { className: "muted", children: team.description || "Brak opisu." })] }), _jsx("button", { className: "btn btn-ghost", onClick: () => nav(`/teams/${team.id}`), children: "Otw\u00F3rz" })] }), _jsxs("div", { style: { marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }, children: [_jsxs("span", { className: "pill", children: ["moja rola: ", team.myRole] }), _jsxs("span", { className: "pill", children: ["cz\u0142onkowie: ", team.memberCount, "/", team.maxMembers] }), _jsxs("span", { className: "pill", children: ["czas: ", team.expectedTimeText || "nie podano"] }), _jsxs("span", { className: "pill", children: ["nast\u0119pne spotkanie: ", formatPl(team.nextMeetingAt)] })] })] }, team.id))) }))] })] })] }) }));
}
