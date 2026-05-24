import React, { useState } from "react";
import type { RecruitmentRequest } from "../../models/Team";
import RequestStatusBadge from "../RequestStatusBadge";
import TeamRoleBadge from "../TeamRoleBadge";
import { TEAM_ROLE_OPTIONS } from "../../data/teamRoles";

type RespondOptions = {
  showOnPublicProfile?: boolean | null;
  teamRoleLabel?: string | null;
};

type Props = {
  requests: RecruitmentRequest[];
  currentUsername?: string | null;
  isOwner?: boolean;
  actingRequestId?: number | null;
  onRespond?: (
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED",
    options?: RespondOptions
  ) => void | Promise<void>;
};

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

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

export default function TeamRequestsList({
  requests,
  currentUsername,
  isOwner = false,
  actingRequestId = null,
  onRespond,
}: Props) {
  const [visibilityByRequestId, setVisibilityByRequestId] = useState<
    Record<number, boolean>
  >({});
  const [teamRoleByRequestId, setTeamRoleByRequestId] = useState<
    Record<number, string>
  >({});

  function getVisibilityChoice(request: RecruitmentRequest) {
    return visibilityByRequestId[request.id] ?? request.showOnPublicProfile ?? true;
  }

  function setVisibilityChoice(requestId: number, value: boolean) {
    setVisibilityByRequestId((prev) => ({
      ...prev,
      [requestId]: value,
    }));
  }

  function getTeamRoleChoice(request: RecruitmentRequest) {
    return teamRoleByRequestId[request.id] ?? request.teamRoleLabel ?? "";
  }

  function setTeamRoleChoice(requestId: number, value: string) {
    setTeamRoleByRequestId((prev) => ({
      ...prev,
      [requestId]: value,
    }));
  }

  function shouldAskVisibilityAndTeamRoleOnAccept(request: RecruitmentRequest) {
    return (
      request.status === "PENDING" &&
      request.requestType === "INVITATION" &&
      request.username === currentUsername
    );
  }

  function canAcceptOrReject(request: RecruitmentRequest) {
    if (request.status !== "PENDING") return false;

    if (request.requestType === "APPLICATION") {
      return isOwner;
    }

    if (request.requestType === "INVITATION") {
      return request.username === currentUsername;
    }

    return false;
  }

  function canCancel(request: RecruitmentRequest) {
    if (request.status !== "PENDING") return false;

    if (request.requestType === "APPLICATION") {
      return request.username === currentUsername;
    }

    if (request.requestType === "INVITATION") {
      return isOwner || request.createdByUsername === currentUsername;
    }

    return false;
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

  if (!requests.length) {
    return (
      <div className="muted">
        Brak zgłoszeń rekrutacyjnych. Nowe aplikacje i zaproszenia pojawią się tutaj.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {requests.map((request) => (
        <div
          key={request.id}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <b>{request.fullName}</b>
            <span className="muted">@{request.username}</span>
            <span className="pill">{requestTypeLabel(request.requestType)}</span>
            <RequestStatusBadge status={request.status} />
            {request.targetRoleName && (
              <span className="pill">Rola projektowa: {request.targetRoleName}</span>
            )}
            {request.teamRoleLabel ? (
              <TeamRoleBadge role={request.teamRoleLabel} />
            ) : (
              <span className="pill">Rola zespołowa: nie ustawiono</span>
            )}
          </div>

          <div className="muted">
            Utworzono: {formatPl(request.createdAt)} | Autor: {" "}
            {request.createdByUsername || "—"}
          </div>

          <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {request.message || "Brak wiadomości."}
          </div>

          {shouldAskVisibilityAndTeamRoleOnAccept(request) && (
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 10,
                display: "grid",
                gap: 10,
              }}
            >
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={getVisibilityChoice(request)}
                  onChange={(e) =>
                    setVisibilityChoice(request.id, e.target.checked)
                  }
                />
                <span>Po dołączeniu pokaż ten projekt na moim profilu publicznym</span>
              </label>

              <label className="field">
                <span className="field-label">
                  Rola zespołowa w tym projekcie
                </span>
                <select
                  className="input"
                  value={getTeamRoleChoice(request)}
                  onChange={(e) => setTeamRoleChoice(request.id, e.target.value)}
                >
                  <option value="">Użyj mojej domyślnej roli z profilu</option>
                  {TEAM_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <span className="field-help">
                  Możesz przyjąć w projekcie inną rolę zespołową niż domyślna rola z profilu.
                </span>
              </label>

              <div className="field-help">
                Jeśli ukryjesz projekt, projekt oraz oceny z tego projektu nie będą widoczne publicznie.
              </div>
            </div>
          )}

          {(canAcceptOrReject(request) || canCancel(request)) && onRespond && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {canAcceptOrReject(request) && (
                <>
                  <button
                    className="btn btn-solid"
                    disabled={actingRequestId === request.id}
                    onClick={() =>
                      void onRespond(
                        request.id,
                        "ACCEPTED",
                        acceptedOptions(request)
                      )
                    }
                  >
                    {actingRequestId === request.id
                      ? "Zapisywanie…"
                      : request.requestType === "APPLICATION"
                        ? "Akceptuj aplikację"
                        : "Akceptuj"}
                  </button>

                  <button
                    className="btn btn-ghost"
                    disabled={actingRequestId === request.id}
                    onClick={() => void onRespond(request.id, "REJECTED")}
                  >
                    {request.requestType === "APPLICATION"
                      ? "Odrzuć aplikację"
                      : "Odrzuć"}
                  </button>
                </>
              )}

              {canCancel(request) && (
                <button
                  className="btn btn-ghost"
                  disabled={actingRequestId === request.id}
                  onClick={() => void onRespond(request.id, "CANCELLED")}
                >
                  Anuluj
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
