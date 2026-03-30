import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MINI_IPIP_QUESTIONS } from "../survey/miniIpip";
import { fetchMySurvey, submitMySurvey } from "../api/survey.api";
import { updateSelectedRole } from "../api/user.api";
const PER_PAGE = 5;
const SCALE = [1, 2, 3, 4, 5];
export default function Survey() {
    const { user, setSelectedRole } = useAuth();
    const nav = useNavigate();
    if (!user)
        return null;
    const username = user.username;
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState(Array(20).fill(null));
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [resultMode, setResultMode] = useState(false);
    const [error, setError] = useState("");
    const [storedResult, setStoredResult] = useState(null);
    const [savingRole, setSavingRole] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchMySurvey(username)
            .then((r) => {
            if (!mounted)
                return;
            if (r?.answers?.length === 20) {
                setAnswers(r.answers);
                setStoredResult(r);
                setResultMode(true);
            }
        })
            .catch((e) => {
            if (!mounted)
                return;
            console.error(e);
        })
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, [username]);
    const pageStart = step * PER_PAGE;
    const pageEnd = pageStart + PER_PAGE;
    const pageQuestions = useMemo(() => MINI_IPIP_QUESTIONS.slice(pageStart, pageEnd).map((q, i) => ({
        index: pageStart + i,
        text: q,
    })), [pageStart, pageEnd]);
    const missingTotal = answers.filter((a) => a == null).length;
    const missingOnPage = useMemo(() => {
        return pageQuestions.filter((q) => answers[q.index] == null).length;
    }, [pageQuestions, answers]);
    function setAnswer(index, value) {
        setAnswers((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }
    function prevStep() {
        setError("");
        setStep((s) => Math.max(0, s - 1));
    }
    function nextStep() {
        setError("");
        if (missingOnPage > 0) {
            setError("Uzupełnij wszystkie odpowiedzi na tej stronie.");
            return;
        }
        setStep((s) => Math.min(3, s + 1));
    }
    async function finish() {
        setError("");
        setSuccessMsg("");
        if (missingTotal > 0) {
            setError("Uzupełnij wszystkie odpowiedzi (brakuje: " + missingTotal + ").");
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitMySurvey(username, answers);
            setStoredResult(res);
            setResultMode(true);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się zapisać ankiety.");
        }
        finally {
            setSubmitting(false);
        }
    }
    async function chooseRole(roleKey) {
        setError("");
        setSuccessMsg("");
        setSavingRole(true);
        try {
            const updatedUser = await updateSelectedRole(roleKey);
            setSelectedRole(updatedUser.selectedRole ?? null);
            setSuccessMsg(`Wybrana rola została zapisana: ${updatedUser.selectedRole}`);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się zapisać wybranej roli.");
        }
        finally {
            setSavingRole(false);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "page", children: _jsx("section", { className: "card", children: _jsx("div", { className: "card-body", children: "\u0141adowanie ankiety\u2026" }) }) }));
    }
    if (resultMode && storedResult) {
        const r = storedResult;
        const top3 = (r.topRoles ?? []).slice(0, 3);
        return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: "Proponowane role" }), _jsx("p", { className: "card-subtitle", children: "Poni\u017Cej 3 role o najwy\u017Cszym dopasowaniu. Kliknij jedn\u0105 z nich, aby zapisa\u0107 j\u0105 na profilu." })] }), _jsxs("div", { className: "card-body", children: [error && _jsx("div", { className: "alert", children: error }), successMsg && _jsx("div", { className: "alert", style: { background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }, children: successMsg }), _jsxs("div", { className: "result-box", children: [_jsx("h3", { children: "Top 3 role (dopasowanie 0\u20131)" }), _jsx("ol", { className: "result-list", children: top3.map((x) => {
                                            const isSelected = user.selectedRole === x.key;
                                            return (_jsxs("li", { style: {
                                                    marginBottom: 12,
                                                    padding: 12,
                                                    borderRadius: 14,
                                                    border: isSelected ? "2px solid var(--accent, #111827)" : "1px solid var(--border, #e5e7eb)",
                                                    background: isSelected ? "rgba(0,0,0,0.03)" : "transparent",
                                                }, children: [_jsxs("div", { style: { display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }, children: [_jsx("b", { children: x.key }), _jsxs("span", { className: "pill", children: ["dopasowanie: ", Math.max(0, Math.min(1, x.score)).toFixed(3)] }), isSelected && _jsx("span", { className: "pill", children: "wybrana rola" })] }), _jsx("div", { className: "muted", style: { marginTop: 6 }, children: x.explanation }), _jsx("div", { style: { marginTop: 10 }, children: _jsx("button", { className: isSelected ? "btn btn-solid" : "btn btn-ghost", onClick: () => chooseRole(x.key), disabled: savingRole, children: savingRole
                                                                ? "Zapisywanie…"
                                                                : isSelected
                                                                    ? "Rola wybrana"
                                                                    : "Wybierz tę rolę" }) })] }, x.key));
                                        }) })] }), _jsxs("div", { style: { display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }, children: [_jsx("button", { className: "btn btn-solid", onClick: () => nav("/teams"), children: "Przejd\u017A do zespo\u0142\u00F3w" }), _jsx("button", { className: "btn btn-ghost", onClick: () => {
                                            setResultMode(false);
                                            setStep(0);
                                            setSuccessMsg("");
                                            setError("");
                                        }, children: "Zmie\u0144 odpowiedzi" }), _jsx("button", { className: "btn btn-ghost", onClick: () => nav("/profile"), children: "Profil" })] }), _jsxs("p", { style: { marginTop: 10, color: "var(--muted)", fontWeight: 700 }, children: ["Zapisano: ", new Date(r.completedAt).toLocaleString("pl-PL")] })] })] }) }));
    }
    return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: "Ankieta: Mini-IPIP" }), _jsxs("p", { className: "card-subtitle", children: ["Krok ", step + 1, "/4 \u2014 pytania ", pageStart + 1, "\u2013", pageEnd, " (skala 1 (ca\u0142kowicie si\u0119 nie zgadzam) \u2013 5 (ca\u0142kowicie si\u0119 zgadzam))."] })] }), _jsxs("div", { className: "card-body", children: [error && _jsx("div", { className: "alert", children: error }), _jsx("div", { className: "survey-list", children: pageQuestions.map(({ index, text }) => (_jsxs("div", { className: "survey-item", children: [_jsxs("div", { className: "survey-q", children: [_jsxs("span", { className: "survey-no", children: [index + 1, "."] }), " ", text] }), _jsx("div", { className: "survey-scale", role: "radiogroup", "aria-label": `Pytanie ${index + 1}`, children: SCALE.map((v) => (_jsxs("label", { className: `survey-pill ${answers[index] === v ? "active" : ""}`, children: [_jsx("input", { type: "radio", name: `q${index}`, value: v, checked: answers[index] === v, onChange: () => setAnswer(index, v) }), v] }, v))) })] }, index))) }), _jsxs("div", { style: { display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }, children: [_jsx("button", { className: "btn btn-ghost", onClick: () => nav("/profile"), children: "Profil" }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { className: "btn btn-ghost", disabled: step === 0, onClick: prevStep, children: "Wstecz" }), step < 3 ? (_jsx("button", { className: "btn btn-solid", onClick: nextStep, children: "Dalej" })) : (_jsx("button", { className: "btn btn-solid", disabled: submitting, onClick: finish, children: submitting ? "Zapisywanie…" : "Zakończ" })), _jsxs("span", { style: { color: "var(--muted)", fontWeight: 800 }, children: ["Brakuje odpowiedzi: ", missingTotal] })] })] })] }) }));
}
