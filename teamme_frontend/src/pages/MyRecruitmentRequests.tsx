import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RecruitmentRequest } from "../models/Team";
import { fetchMyRecruitmentRequests, respondToRequest } from "../api/teams.api";
import { extractApiMessage } from "../api/http";

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

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL");
}

export default function MyRecruitmentRequests() {
  const nav = useNavigate();

  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingRequestId, setActingRequestId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyRecruitmentRequests();
      setRequests(data ?? []);
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "PENDING"),
    [requests]
  );

  const historyRequests = useMemo(
    () => requests.filter((request) => request.status !== "PENDING"),
    [requests]
  );

  async function handleRespond(
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED"
  ) {
    setActingRequestId(requestId);
    setError("");
    setSuccessMsg("");

    try {
      await respondToRequest(requestId, { decision });
      setSuccessMsg("Status zgłoszenia został zaktualizowany.");
      await load();
    } catch (e: unknown) {
      setError(extractApiMessage(e));
    } finally {
      setActingRequestId(null);
    }
  }

  function renderActions(request: RecruitmentRequest) {
    if (request.status !== "PENDING") return null;

    if (request.requestType === "APPLICATION") {
      return (
        <button
          className="btn btn-ghost"
          disabled={actingRequestId === request.id}
          onClick={() => void handleRespond(request.id, "CANCELLED")}
        >
          {actingRequestId === request.id ? "Zapisywanie…" : "Anuluj aplikację"}
        </button>
      );
    }

    if (request.requestType === "INVITATION") {
      return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-solid"
            disabled={actingRequestId === request.id}
            onClick={() => void handleRespond(request.id, "ACCEPTED")}
          >
            {actingRequestId === request.id ? "Zapisywanie…" : "Przyjmij"}
          </button>
          <button
            className="btn btn-ghost"
            disabled={actingRequestId === request.id}
            onClick={() => void handleRespond(request.id, "REJECTED")}
          >
            Odrzuć
          </button>
        </div>
      );
    }

    return null;
  }

  function renderRequestCard(request: RecruitmentRequest) {
    return (
      <div
        key={request.id}
        className="profile-block"
        style={{ display: "grid", gap: 8 }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="pill">{requestTypeLabel(request.requestType)}</span>
          <span className="pill">{requestStatusLabel(request.status)}</span>
          {request.targetRoleName && <span className="pill">rola: {request.targetRoleName}</span>}
        </div>

        <div>
          <b>Użytkownik:</b> {request.fullName}{" "}
          <span className="muted">(@{request.username})</span>
        </div>

        <div className="muted">
          Utworzono: {formatPl(request.createdAt)}
          {request.respondedAt ? ` | Odpowiedź: ${formatPl(request.respondedAt)}` : ""}
        </div>

        <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
          {request.message || "Brak wiadomości."}
        </div>

        {renderActions(request)}
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 className="card-title">Moje aplikacje i zaproszenia</h2>
              <p className="card-subtitle">
                Tu zobaczysz wysłane aplikacje oraz otrzymane zaproszenia do zespołów.
              </p>
            </div>

            <button className="btn btn-ghost" onClick={() => nav("/teams")}>
              Wróć do zespołów
            </button>
          </div>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}
          {successMsg && (
            <div
              className="alert"
              style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
            >
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="profile-block">
              <div className="muted">Ładowanie zgłoszeń…</div>
            </div>
          ) : (
            <>
              <div className="profile-block">
                <div className="profile-block-title">
                  Oczekujące ({pendingRequests.length})
                </div>

                {pendingRequests.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {pendingRequests.map(renderRequestCard)}
                  </div>
                ) : (
                  <div className="muted">Brak oczekujących aplikacji i zaproszeń.</div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">
                  Historia ({historyRequests.length})
                </div>

                {historyRequests.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {historyRequests.map(renderRequestCard)}
                  </div>
                ) : (
                  <div className="muted">Brak historii zgłoszeń.</div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}