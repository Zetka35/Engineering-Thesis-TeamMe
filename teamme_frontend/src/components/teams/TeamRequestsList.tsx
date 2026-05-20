import React, { useState } from "react";
import type { RecruitmentRequest } from "../../models/Team";
import RequestStatusBadge from "../RequestStatusBadge";

type Props = {
  requests: RecruitmentRequest[];
  currentUsername?: string | null;
  isOwner?: boolean;
  actingRequestId?: number | null;
  onRespond?: (
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED",
    options?: { showOnPublicProfile?: boolean | null }
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
  const [visibilityByRequestId, setVisibilityByRequestId] = useState<
    Record<number, boolean>
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

  function shouldAskVisibilityOnAccept(request: RecruitmentRequest) {
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
              <span className="pill">rola: {request.targetRoleName}</span>
            )}
          </div>

          <div className="muted">
            Utworzono: {formatPl(request.createdAt)} | Autor:{" "}
            {request.createdByUsername || "—"}
          </div>

          <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {request.message || "Brak wiadomości."}
          </div>

          {shouldAskVisibilityOnAccept(request) && (
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 10,
                display: "grid",
                gap: 6,
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
                <span>
                  Po dołączeniu pokaż ten projekt na moim profilu publicznym
                </span>
              </label>

              <div className="field-help">
                Jeśli wyłączysz tę opcję, projekt oraz oceny z tego projektu nie
                będą widoczne publicznie.
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
                      void onRespond(request.id, "ACCEPTED", {
                        showOnPublicProfile: getVisibilityChoice(request),
                      })
                    }
                  >
                    {actingRequestId === request.id
                      ? "Zapisywanie…"
                      : "Akceptuj"}
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