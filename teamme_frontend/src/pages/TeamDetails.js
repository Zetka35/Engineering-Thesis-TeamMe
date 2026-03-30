import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMeeting, createTask, fetchTeam, updateTeam } from "../api/teams.api";
function toIso(localValue) {
    if (!localValue)
        return undefined;
    return new Date(localValue).toISOString();
}
export default function TeamDetails() {
    const { teamId } = useParams();
    const nav = useNavigate();
    const numericTeamId = Number(teamId);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingMeeting, setSavingMeeting] = useState(false);
    const [savingTask, setSavingTask] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [expectedTimeText, setExpectedTimeText] = useState("");
    const [maxMembers, setMaxMembers] = useState(4);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingDescription, setMeetingDescription] = useState("");
    const [meetingStartsAt, setMeetingStartsAt] = useState("");
    const [meetingEndsAt, setMeetingEndsAt] = useState("");
    const [meetingLocation, setMeetingLocation] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskDueAt, setTaskDueAt] = useState("");
    const [assigneeUserId, setAssigneeUserId] = useState("");
    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchTeam(numericTeamId);
            setTeam(data);
            setName(data.name);
            setDescription(data.description ?? "");
            setExpectedTimeText(data.expectedTimeText ?? "");
            setMaxMembers(data.maxMembers);
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się pobrać zespołu.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (!Number.isFinite(numericTeamId))
            return;
        load();
    }, [numericTeamId]);
    async function onSaveProfile(e) {
        e.preventDefault();
        setSavingProfile(true);
        setError("");
        setSuccessMsg("");
        try {
            const updated = await updateTeam(numericTeamId, {
                name,
                description,
                expectedTimeText,
                maxMembers,
            });
            setTeam(updated);
            setSuccessMsg("Profil zespołu został zapisany.");
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się zapisać profilu zespołu.");
        }
        finally {
            setSavingProfile(false);
        }
    }
    async function onCreateMeeting(e) {
        e.preventDefault();
        setSavingMeeting(true);
        setError("");
        setSuccessMsg("");
        try {
            const updated = await createMeeting(numericTeamId, {
                title: meetingTitle,
                description: meetingDescription,
                startsAt: toIso(meetingStartsAt),
                endsAt: toIso(meetingEndsAt),
                location: meetingLocation,
            });
            setTeam(updated);
            setMeetingTitle("");
            setMeetingDescription("");
            setMeetingStartsAt("");
            setMeetingEndsAt("");
            setMeetingLocation("");
            setSuccessMsg("Spotkanie zostało dodane.");
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się dodać spotkania.");
        }
        finally {
            setSavingMeeting(false);
        }
    }
    async function onCreateTask(e) {
        e.preventDefault();
        setSavingTask(true);
        setError("");
        setSuccessMsg("");
        try {
            const updated = await createTask(numericTeamId, {
                title: taskTitle,
                description: taskDescription,
                dueAt: toIso(taskDueAt),
                assigneeUserId: assigneeUserId === "" ? null : assigneeUserId,
            });
            setTeam(updated);
            setTaskTitle("");
            setTaskDescription("");
            setTaskDueAt("");
            setAssigneeUserId("");
            setSuccessMsg("Zadanie zostało dodane.");
        }
        catch (e) {
            setError(e?.message ?? "Nie udało się dodać zadania.");
        }
        finally {
            setSavingTask(false);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "page", children: _jsx("section", { className: "card", children: _jsx("div", { className: "card-body", children: "\u0141adowanie zespo\u0142u\u2026" }) }) }));
    }
    if (!team) {
        return (_jsx("div", { className: "page", children: _jsx("section", { className: "card", children: _jsx("div", { className: "card-body", children: "Nie znaleziono zespo\u0142u." }) }) }));
    }
    return (_jsx("div", { className: "page", children: _jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { className: "card-title", children: team.name }), _jsxs("p", { className: "card-subtitle", children: ["W\u0142a\u015Bciciel: ", team.ownerUsername || "—", " \u00B7 moja rola: ", team.myRole] })] }), _jsxs("div", { className: "card-body", children: [error && _jsx("div", { className: "alert", children: error }), successMsg && _jsx("div", { className: "alert", style: { background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }, children: successMsg }), _jsx("div", { style: { marginBottom: 16 }, children: _jsx("button", { className: "btn btn-ghost", onClick: () => nav("/teams"), children: "\u2190 Wr\u00F3\u0107 do listy" }) }), _jsxs("div", { className: "profile-block", style: { marginBottom: 16 }, children: [_jsx("div", { className: "profile-block-title", children: "Profil zespo\u0142u" }), _jsxs("form", { onSubmit: onSaveProfile, style: { display: "grid", gap: 12 }, children: [_jsx("input", { className: "input", value: name, onChange: (e) => setName(e.target.value), required: true }), _jsx("textarea", { className: "input", rows: 4, value: description, onChange: (e) => setDescription(e.target.value) }), _jsx("input", { className: "input", value: expectedTimeText, onChange: (e) => setExpectedTimeText(e.target.value) }), _jsx("input", { className: "input", type: "number", min: 1, value: maxMembers, onChange: (e) => setMaxMembers(Number(e.target.value)), required: true }), _jsx("div", { children: _jsx("button", { className: "btn btn-solid", disabled: savingProfile, children: savingProfile ? "Zapisywanie…" : "Zapisz profil zespołu" }) })] })] }), _jsxs("div", { className: "profile-block", style: { marginBottom: 16 }, children: [_jsx("div", { className: "profile-block-title", children: "Cz\u0142onkowie" }), _jsx("div", { style: { display: "grid", gap: 8 }, children: team.members.map((m) => (_jsxs("div", { children: [_jsx("b", { children: m.fullName }), " ", _jsxs("span", { className: "muted", children: ["(@", m.username, ")"] }), " \u00B7 ", m.roleLabel] }, m.userId))) })] }), _jsxs("div", { className: "profile-block", style: { marginBottom: 16 }, children: [_jsx("div", { className: "profile-block-title", children: "Nowe spotkanie" }), _jsxs("form", { onSubmit: onCreateMeeting, style: { display: "grid", gap: 12 }, children: [_jsx("input", { className: "input", placeholder: "Tytu\u0142 spotkania", value: meetingTitle, onChange: (e) => setMeetingTitle(e.target.value), required: true }), _jsx("textarea", { className: "input", rows: 3, placeholder: "Opis spotkania", value: meetingDescription, onChange: (e) => setMeetingDescription(e.target.value) }), _jsx("input", { className: "input", type: "datetime-local", value: meetingStartsAt, onChange: (e) => setMeetingStartsAt(e.target.value), required: true }), _jsx("input", { className: "input", type: "datetime-local", value: meetingEndsAt, onChange: (e) => setMeetingEndsAt(e.target.value) }), _jsx("input", { className: "input", placeholder: "Miejsce / link", value: meetingLocation, onChange: (e) => setMeetingLocation(e.target.value) }), _jsx("div", { children: _jsx("button", { className: "btn btn-solid", disabled: savingMeeting, children: savingMeeting ? "Dodawanie…" : "Dodaj spotkanie" }) })] }), _jsx("div", { style: { marginTop: 16, display: "grid", gap: 8 }, children: team.meetings.map((m) => (_jsxs("div", { children: [_jsx("b", { children: m.title }), " \u00B7 ", new Date(m.startsAt).toLocaleString("pl-PL"), m.location ? ` · ${m.location}` : ""] }, m.id))) })] }), _jsxs("div", { className: "profile-block", children: [_jsx("div", { className: "profile-block-title", children: "Nowe zadanie" }), _jsxs("form", { onSubmit: onCreateTask, style: { display: "grid", gap: 12 }, children: [_jsx("input", { className: "input", placeholder: "Tytu\u0142 zadania", value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), required: true }), _jsx("textarea", { className: "input", rows: 3, placeholder: "Opis zadania", value: taskDescription, onChange: (e) => setTaskDescription(e.target.value) }), _jsx("input", { className: "input", type: "datetime-local", value: taskDueAt, onChange: (e) => setTaskDueAt(e.target.value) }), _jsxs("select", { className: "input", value: assigneeUserId, onChange: (e) => setAssigneeUserId(e.target.value === "" ? "" : Number(e.target.value)), children: [_jsx("option", { value: "", children: "Ca\u0142y zesp\u00F3\u0142 / bez przypisania" }), team.members.map((m) => (_jsxs("option", { value: m.userId, children: [m.fullName, " (@", m.username, ")"] }, m.userId)))] }), _jsx("div", { children: _jsx("button", { className: "btn btn-solid", disabled: savingTask, children: savingTask ? "Dodawanie…" : "Dodaj zadanie" }) })] }), _jsx("div", { style: { marginTop: 16, display: "grid", gap: 8 }, children: team.tasks.map((t) => (_jsxs("div", { children: [_jsx("b", { children: t.title }), " \u00B7 ", t.status, t.assigneeUsername ? ` · przypisane do @${t.assigneeUsername}` : " · dla całego zespołu", t.dueAt ? ` · termin: ${new Date(t.dueAt).toLocaleString("pl-PL")}` : ""] }, t.id))) })] })] })] }) }));
}
