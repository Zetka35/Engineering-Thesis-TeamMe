import { computeSurveyResult } from "../survey/miniIpip";
import { get } from "./http";
// ustaw true, jeśli chcesz lokalny mock 
const MOCK = false;
const key = (username) => `teamme:miniipip:${username}`;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function postJson(path, body) {
    const res = await fetch(`http://localhost:8080${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return (await res.json());
}
export async function fetchMySurvey(username) {
    if (MOCK) {
        await sleep(200);
        const raw = localStorage.getItem(key(username));
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            localStorage.removeItem(key(username));
            return null;
        }
    }
    // backend bierze usera z cookie, więc username nie jest potrzebny w URL
    return await get("/api/surveys/mini-ipip/me");
}
export async function submitMySurvey(username, answers) {
    if (MOCK) {
        await sleep(250);
        const result = computeSurveyResult(answers);
        localStorage.setItem(key(username), JSON.stringify(result));
        return result;
    }
    // backend: POST /api/surveys/mini-ipip
    return await postJson("/api/surveys/mini-ipip", { answers });
}
export async function clearMySurvey(username) {
    if (MOCK) {
        await sleep(150);
        localStorage.removeItem(key(username));
        return;
    }
    // jeśli masz backend DELETE, to:
    const res = await fetch("http://localhost:8080/api/surveys/mini-ipip/me", {
        method: "DELETE",
        credentials: "include",
    });
    // jeśli backend nie ma DELETE, możesz usunąć całą funkcję clearMySurvey
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
    }
}
