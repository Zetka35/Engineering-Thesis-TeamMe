const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";
async function putJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
export async function updateSelectedRole(selectedRole) {
    return putJson("/api/users/me/selected-role", { selectedRole });
}
export async function updateMyProfile(payload) {
    return putJson("/api/users/me", payload);
}
