import React from "react";
import type { RecruitmentRequest } from "../../models/Team";

type Props = {
  requests: RecruitmentRequest[];
  currentUsername?: string | null;
  isOwner?: boolean;
  actingRequestId?: number | null;
  onRespond?: (
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED"
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

function requestStatusLabel(value?: string | null) {
  switch (value) {
    case "PENDING":
      return "Oczekujące";
    case "ACCEPTED":
      return "Zaakceptowane";
    case "REJECTED":
      return "Odrzucone";
    case "CANCELLED":
      return "Anulowane";
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

  if (!requests.length) {
    return <div className="muted">Brak zgłoszeń rekrutacyjnych.</div>;
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <b>{request.fullName}</b>
            <span className="muted">@{request.username}</span>
            <span className="pill">{requestTypeLabel(request.requestType)}</span>
            <span className="pill">{requestStatusLabel(request.status)}</span>
            {request.targetRoleName && <span className="pill">rola: {request.targetRoleName}</span>}
          </div>

          <div className="muted">
            Utworzono: {formatPl(request.createdAt)} | Autor: {request.createdByUsername || "—"}
          </div>

          <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {request.message || "Brak wiadomości."}
          </div>

          {(canAcceptOrReject(request) || canCancel(request)) && onRespond && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {canAcceptOrReject(request) && (
                <>
                  <button
                    className="btn btn-solid"
                    disabled={actingRequestId === request.id}
                    onClick={() => void onRespond(request.id, "ACCEPTED")}
                  >
                    {actingRequestId === request.id ? "Zapisywanie…" : "Akceptuj"}
                  </button>

                  <button
                    className="btn btn-ghost"
                    disabled={actingRequestId === request.id}
                    onClick={() => void onRespond(request.id, "REJECTED")}
                  >
                    Odrzuć
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