import { get, post, put } from "./http";
export function fetchTeams() {
    return get("/api/teams");
}
export function fetchTeam(teamId) {
    return get(`/api/teams/${teamId}`);
}
export function createTeam(payload) {
    return post("/api/teams", payload);
}
export function updateTeam(teamId, payload) {
    return put(`/api/teams/${teamId}`, payload);
}
export function createMeeting(teamId, payload) {
    return post(`/api/teams/${teamId}/meetings`, payload);
}
export function createTask(teamId, payload) {
    return post(`/api/teams/${teamId}/tasks`, payload);
}
