import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchMySurvey } from "../api/survey.api";
import { updateMyProfile } from "../api/user.api";
const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border, #d7e1e8)",
    background: "white",
    font: "inherit",
};
const textareaStyle = {
    ...inputStyle,
    minHeight: 110,
    resize: "vertical",
};
export default function Profile() {
    const { user, mergeUser } = useAuth();
    const nav = useNavigate();
    if (!user)
        return null;
    const username = user.username;
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [error, setError] = useState("");
    const [firstName, setFirstName] = useState(user.firstName ?? "");
    const [lastName, setLastName] = useState(user.lastName ?? "");
    const [bio, setBio] = useState(user.bio ?? "");
    useEffect(() => {
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setBio(user.bio ?? "");
    }, [user.firstName, user.lastName, user.bio]);
    useEffect(() => {
        setLoading(true);
        fetchMySurvey(username)
            .then(setSurvey)
            .catch(() => setSurvey(null))
            .finally(() => setLoading(false));
    }, [username]);
    async function saveProfile() {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const updated = await updateMyProfile({
                firstName,
                lastName,
                bio,
            });
            mergeUser({
                firstName: updated.firstName ?? null,
                lastName: updated.lastName ?? null,
                bio: updated.bio ?? null,
            });
            setSuccessMsg("Profil został zapisany.");
            setEditing(false);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się zapisać profilu.");
        }
        finally {
            setSaving(false);
        }
    }
    const hasSelectedRole = !!user.selectedRole;
    const hasSurvey = !!survey;
    return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: "Profil" }), _jsx("p", { className: "card-subtitle", children: "Ankieta \u201EMoja rola w zespole\u201D." })] }), _jsxs("div", { className: "card-body", children: [error && _jsx("div", { className: "alert", children: error }), successMsg && (_jsx("div", { className: "alert", style: { background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }, children: successMsg })), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("div", { children: [_jsx("b", { children: "U\u017Cytkownik:" }), " ", username] }), _jsxs("div", { className: "profile-block", children: [_jsxs("div", { style: {
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                marginBottom: 12,
                                            }, children: [_jsx("div", { className: "profile-block-title", children: "Dane podstawowe" }), !editing ? (_jsx("button", { className: "btn btn-ghost", onClick: () => setEditing(true), children: "Edytuj profil" })) : (_jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [_jsx("button", { className: "btn btn-solid", onClick: saveProfile, disabled: saving, children: saving ? "Zapisywanie…" : "Zapisz" }), _jsx("button", { className: "btn btn-ghost", onClick: () => {
                                                                setEditing(false);
                                                                setFirstName(user.firstName ?? "");
                                                                setLastName(user.lastName ?? "");
                                                                setBio(user.bio ?? "");
                                                                setError("");
                                                                setSuccessMsg("");
                                                            }, children: "Anuluj" })] }))] }), editing ? (_jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { children: _jsx("b", { children: "Imi\u0119" }) }), _jsx("input", { style: inputStyle, value: firstName, onChange: (e) => setFirstName(e.target.value), maxLength: 80 })] }), _jsxs("div", { children: [_jsx("label", { children: _jsx("b", { children: "Nazwisko" }) }), _jsx("input", { style: inputStyle, value: lastName, onChange: (e) => setLastName(e.target.value), maxLength: 80 })] }), _jsxs("div", { children: [_jsx("label", { children: _jsx("b", { children: "Opis" }) }), _jsx("textarea", { style: textareaStyle, value: bio, onChange: (e) => setBio(e.target.value), maxLength: 1000, placeholder: "Napisz kilka zda\u0144 o sobie, swoich zainteresowaniach, mocnych stronach lub preferowanej roli w zespole." })] })] })) : (_jsxs("div", { style: { display: "grid", gap: 8 }, children: [_jsxs("div", { children: [_jsx("b", { children: "Imi\u0119:" }), " ", user.firstName || "—"] }), _jsxs("div", { children: [_jsx("b", { children: "Nazwisko:" }), " ", user.lastName || "—"] }), _jsxs("div", { children: [_jsx("b", { children: "Opis:" }), " ", user.bio ? (_jsx("span", { className: "muted", style: { whiteSpace: "pre-wrap" }, children: user.bio })) : (_jsx("span", { className: "muted", children: "Brak opisu." }))] })] }))] }), _jsxs("div", { className: "profile-block", children: [_jsx("div", { className: "profile-block-title", children: "Wybrana rola" }), hasSelectedRole ? (_jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [_jsx("span", { className: "pill", children: user.selectedRole }), _jsx("span", { className: "muted", style: { fontWeight: 700 }, children: "To jest rola zapisana na Twoim profilu." })] })) : (_jsx("div", { className: "muted", style: { fontWeight: 800 }, children: "Nie wybrano jeszcze roli." }))] }), _jsxs("div", { className: "profile-block", children: [_jsx("div", { className: "profile-block-title", children: "Moja rola w zespole (ankieta)" }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [_jsx("button", { className: "btn btn-solid", onClick: () => nav("/survey"), children: hasSurvey ? "Powtórz ankietę" : "Uruchom ankietę" }), loading ? (_jsx("span", { className: "muted", style: { fontWeight: 800 }, children: "Sprawdzam status\u2026" })) : hasSurvey ? (_jsxs("span", { className: "muted", style: { fontWeight: 800 }, children: ["Ankieta wykonana: ", new Date(survey.completedAt).toLocaleString("pl-PL")] })) : hasSelectedRole ? (_jsx("span", { className: "muted", style: { fontWeight: 800 }, children: "Rola jest ju\u017C zapisana na profilu." })) : (_jsx("span", { className: "muted", style: { fontWeight: 800 }, children: "Ankieta jeszcze niewykonana." }))] }), hasSurvey && (_jsxs("div", { style: { marginTop: 10 }, children: [_jsx("b", { children: "Top 3 (ostatni wynik):" }), " ", survey.topRoles
                                                    .map((x) => `${x.key} (${Math.max(0, Math.min(1, x.score)).toFixed(3)})`)
                                                    .join(", ")] }))] })] })] })] }) }));
}
