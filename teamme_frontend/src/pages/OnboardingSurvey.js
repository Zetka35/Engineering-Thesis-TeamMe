import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
export default function OnboardingSurvey() {
    const { user } = useAuth();
    const nav = useNavigate();
    if (!user)
        return null;
    return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: "Moja rola w zespole" }), _jsx("p", { className: "card-subtitle", children: "Chcesz teraz wykona\u0107 kr\u00F3tk\u0105 ankiet\u0119 (Mini-IPIP, 20 pyta\u0144)? Na podstawie wynik\u00F3w zaproponujemy 2\u20133 role projektowe." })] }), _jsxs("div", { className: "card-body", children: [_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx("button", { className: "btn btn-solid", onClick: () => nav("/survey"), children: "Wykonaj teraz" }), _jsx("button", { className: "btn btn-ghost", onClick: () => nav("/teams"), children: "Pomi\u0144 na p\u00F3\u017Aniej" })] }), _jsx("p", { style: { marginTop: 12, color: "var(--muted)", fontWeight: 700 }, children: "Ankiet\u0119 mo\u017Cesz uruchomi\u0107 p\u00F3\u017Aniej z poziomu: Profil \u2192 \u201EMoja rola w zespole\u201D." })] })] }) }));
}
