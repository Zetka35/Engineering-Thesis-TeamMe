function key(username) {
    return `teamme:miniipip:${username}`;
}
export function loadSurvey(username) {
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
export function saveSurvey(username, result) {
    localStorage.setItem(key(username), JSON.stringify(result));
}
export function clearSurvey(username) {
    localStorage.removeItem(key(username));
}
