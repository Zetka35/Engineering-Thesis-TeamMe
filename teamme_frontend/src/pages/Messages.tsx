import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { RecruitmentRequest } from "../models/Team";
import { fetchMyRecruitmentRequests, respondToRequest } from "../api/teams.api";
import { extractApiMessage } from "../api/http";
import { useNotifications } from "../notifications/NotificationsContext";
import EmptyState from "../components/EmptyState";
import RequestStatusBadge from "../components/RequestStatusBadge";
import TeamRoleBadge from "../components/TeamRoleBadge";
import { TEAM_ROLE_OPTIONS } from "../data/teamRoles";
import { countActionableRecruitmentRequests } from "../data/recruitmentNotifications";

type RespondOptions = {
  showOnPublicProfile?: boolean | null;
  teamRoleLabel?: string | null;
};

function requestTypeLabel(value?: string | null) {
  switch (value) {
    case "APPLICATION":
      return "Aplikacja";
    case "INVITATION":
      return "Zaproszenie";
    default:
      return value || "—";
  }
}

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

export default function Messages() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { refreshSignal, setPendingRecruitmentCount } = useNotifications();

  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingRequestId, setActingRequestId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [visibilityByRequestId, setVisibilityByRequestId] = useState<Record<number, boolean>>({});
  const [teamRoleByRequestId, setTeamRoleByRequestId] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyRecruitmentRequests();
      setRequests(data ?? []);
      setPendingRecruitmentCount(
  countActionableRecruitmentRequests(data ?? [], user?.username)
);
    } catch (e: unknown) {
      setError(`Nie udało się załadować zaproszeń i zgłoszeń. ${extractApiMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [refreshSignal]);

  const currentUsername = user?.username ?? "";

  const incomingApplications = useMemo(
  () =>
    requests.filter(
      (request) =>
        request.status === "PENDING" &&
        request.requestType === "APPLICATION" &&
        request.createdByUsername !== currentUsername
    ),
  [requests, currentUsername]
);

  const incomingInvitations = useMemo(
  () =>
    requests.filter(
      (request) =>
        request.status === "PENDING" &&
        request.requestType === "INVITATION" &&
        request.username === currentUsername
    ),
  [requests, currentUsername]
);

const outgoingInvitations = useMemo(
  () =>
    requests.filter(
      (request) =>
        request.status === "PENDING" &&
        request.requestType === "INVITATION" &&
        request.createdByUsername === currentUsername
    ),
  [requests, currentUsername]
);

const myApplications = useMemo(
  () =>
    requests.filter(
      (request) =>
        request.status === "PENDING" &&
        request.requestType === "APPLICATION" &&
        request.createdByUsername === currentUsername
    ),
  [requests, currentUsername]
);

const historyRequests = useMemo(
  () => requests.filter((request) => request.status !== "PENDING"),
  [requests]
);

  function getVisibilityChoice(request: RecruitmentRequest) {
    return visibilityByRequestId[request.id] ?? request.showOnPublicProfile ?? true;
  }

  function setVisibilityChoice(requestId: number, value: boolean) {
    setVisibilityByRequestId((prev) => ({ ...prev, [requestId]: value }));
  }

  function getTeamRoleChoice(request: RecruitmentRequest) {
    return teamRoleByRequestId[request.id] ?? request.teamRoleLabel ?? "";
  }

  function setTeamRoleChoice(requestId: number, value: string) {
    setTeamRoleByRequestId((prev) => ({ ...prev, [requestId]: value }));
  }

  function shouldAskVisibilityAndTeamRoleOnAccept(request: RecruitmentRequest) {
    return request.status === "PENDING" && request.requestType === "INVITATION" && request.username === currentUsername;
  }

  function acceptedOptions(request: RecruitmentRequest): RespondOptions | undefined {
    if (shouldAskVisibilityAndTeamRoleOnAccept(request)) {
      return {
        showOnPublicProfile: getVisibilityChoice(request),
        teamRoleLabel: getTeamRoleChoice(request) || null,
      };
    }

    return undefined;
  }

  async function handleRespond(
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED",
    options?: RespondOptions
  ) {
    setActingRequestId(requestId);
    setError("");
    setSuccessMsg("");

    try {
      await respondToRequest(requestId, {
        decision,
        showOnPublicProfile: options?.showOnPublicProfile ?? null,
        teamRoleLabel: options?.teamRoleLabel ?? null,
      });

      setSuccessMsg(
        decision === "ACCEPTED"
          ? "Zgłoszenie zostało zaakceptowane."
          : decision === "REJECTED"
            ? "Zgłoszenie zostało odrzucone."
            : "Zgłoszenie zostało anulowane."
      );

      await load();
    } catch (e: unknown) {
      setError(`Nie udało się zaktualizować zgłoszenia. ${extractApiMessage(e)}`);
    } finally {
      setActingRequestId(null);
    }
  }

  function renderActions(request: RecruitmentRequest) {
    if (request.status !== "PENDING") return null;

    const isIncomingApplication = request.requestType === "APPLICATION" && request.createdByUsername !== currentUsername;
    const isIncomingInvitation = request.requestType === "INVITATION" && request.username === currentUsername;
    const isOutgoingInvitation = request.requestType === "INVITATION" && request.createdByUsername === currentUsername;
    const isMyApplication = request.requestType === "APPLICATION" && request.createdByUsername === currentUsername;

    if (isIncomingApplication) {
      return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-solid" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "ACCEPTED")}>
            {actingRequestId === request.id ? "Zapisywanie…" : "Akceptuj aplikację"}
          </button>
          <button className="btn btn-ghost" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "REJECTED")}>
            Odrzuć aplikację
          </button>
        </div>
      );
    }

    if (isIncomingInvitation) {
      return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-solid" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "ACCEPTED", acceptedOptions(request))}>
            {actingRequestId === request.id ? "Zapisywanie…" : "Przyjmij"}
          </button>
          <button className="btn btn-ghost" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "REJECTED")}>
            Odrzuć
          </button>
        </div>
      );
    }

    if (isOutgoingInvitation) {
      return (
        <button className="btn btn-ghost" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "CANCELLED")}>
          {actingRequestId === request.id ? "Zapisywanie…" : "Anuluj zaproszenie"}
        </button>
      );
    }

    if (isMyApplication) {
      return (
        <button className="btn btn-ghost" disabled={actingRequestId === request.id} onClick={() => void handleRespond(request.id, "CANCELLED")}>
          {actingRequestId === request.id ? "Zapisywanie…" : "Anuluj aplikację"}
        </button>
      );
    }

    return null;
  }

  function renderInvitationAcceptanceOptions(request: RecruitmentRequest) {
    if (!shouldAskVisibilityAndTeamRoleOnAccept(request)) return null;

    return (
      <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, display: "grid", gap: 10 }}>
        <label className="checkbox-line">
          <input type="checkbox" checked={getVisibilityChoice(request)} onChange={(e) => setVisibilityChoice(request.id, e.target.checked)} />
          <span>Po dołączeniu pokaż ten projekt na moim profilu publicznym</span>
        </label>

        <label className="field">
          <span className="field-label">Rola zespołowa w tym projekcie</span>
          <select className="input" value={getTeamRoleChoice(request)} onChange={(e) => setTeamRoleChoice(request.id, e.target.value)}>
            <option value="">Użyj mojej domyślnej roli z profilu</option>
            {TEAM_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <span className="field-help">Możesz przyjąć w tym projekcie inną rolę zespołową niż domyślna rola z profilu.</span>
        </label>
      </div>
    );
  }

  function renderRequestCard(request: RecruitmentRequest, contextLabel: string) {
    return (
      <div key={`${contextLabel}-${request.id}`} className="profile-block" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="pill">{requestTypeLabel(request.requestType)}</span>
          <RequestStatusBadge status={request.status} />
          {request.targetRoleName && <span className="pill">Rola projektowa: {request.targetRoleName}</span>}
          {request.teamRoleLabel ? <TeamRoleBadge role={request.teamRoleLabel} /> : <span className="pill">Rola zespołowa: nie ustawiono</span>}
        </div>

        <div><b>Zespół:</b> {request.teamName}</div>
        <div><b>Użytkownik:</b> {request.fullName} <span className="muted">(@{request.username})</span></div>

        <div className="muted">
          Utworzono: {formatPl(request.createdAt)}{request.respondedAt ? ` | Odpowiedź: ${formatPl(request.respondedAt)}` : ""}
        </div>

        <div className="muted" style={{ whiteSpace: "pre-wrap" }}>{request.message || "Brak wiadomości."}</div>

        {renderInvitationAcceptanceOptions(request)}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => nav(`/teams/${request.teamId}`)}>Otwórz zespół</button>
          {renderActions(request)}
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h2 className="card-title">Zaproszenia i zgłoszenia</h2>
              <p className="card-subtitle">Tu znajdziesz aplikacje do Twoich zespołów, otrzymane zaproszenia, wysłane zaproszenia, własne aplikacje i historię decyzji.</p>
            </div>
            <button className="btn btn-ghost" onClick={() => nav("/teams")}>Wróć do zespołów</button>
          </div>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          {loading ? (
            <div className="profile-block"><div className="muted">Ładowanie zaproszeń i zgłoszeń…</div></div>
          ) : (
            <>
              <div className="profile-block">
                <div className="profile-block-title">Aplikacje do moich zespołów ({incomingApplications.length})</div>
                {incomingApplications.length ? (
                  <div style={{ display: "grid", gap: 12 }}>{incomingApplications.map((request) => renderRequestCard(request, "incoming-applications"))}</div>
                ) : (
                  <div className="muted">Brak nowych aplikacji do Twoich zespołow. </div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">Otrzymane zaproszenia ({incomingInvitations.length})</div>
                {incomingInvitations.length ? (
                  <div style={{ display: "grid", gap: 12 }}>{incomingInvitations.map((request) => renderRequestCard(request, "incoming"))}</div>
                ) : (
                  <div className="muted">Brak otrzymanych zaproszeń. </div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">Wysłane zaproszenia ({outgoingInvitations.length})</div>
                {outgoingInvitations.length ? (
                  <div style={{ display: "grid", gap: 12 }}>{outgoingInvitations.map((request) => renderRequestCard(request, "outgoing"))}</div>
                ) : (
                  <div className="muted">Brak wysłanych zaproszeń. </div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">Moje aplikacje ({myApplications.length})</div>
                {myApplications.length ? (
                  <div style={{ display: "grid", gap: 12 }}>{myApplications.map((request) => renderRequestCard(request, "applications"))}</div>
                ) : (
                  <div className="muted">Brak wysłanych aplikacji.</div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">Historia decyzji ({historyRequests.length})</div>
                {historyRequests.length ? (
                  <div style={{ display: "grid", gap: 12 }}>{historyRequests.map((request) => renderRequestCard(request, "history"))}</div>
                ) : (
                  <div className="muted">Brak historii decyzji.</div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
