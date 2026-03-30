const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";
async function postJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ważne: cookie z JWT będzie działać
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        let msg = "Wystąpił błąd";
        try {
            const text = await res.text();
            if (text)
                msg = text;
        }
        catch { }
        throw new Error(msg);
    }
    return (await res.json());
}
export async function login(username, password) {
    return await postJson("/api/auth/login", { username, password });
}
export async function register(username, password) {
    return await postJson("/api/auth/register", { username, password });
}
export async function logout() {
    await postJson("/api/auth/logout", {});
}
export async function me() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok)
        throw new Error("Brak sesji");
    return (await res.json());
}
