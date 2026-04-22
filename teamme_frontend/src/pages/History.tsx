import React, { useEffect, useMemo, useState } from "react";
import { getMyProfile, type ProjectHistoryItem } from "../api/user.api";
import {
  fetchGivenReviews,
  fetchPendingReviews,
  fetchReceivedReviews,
  submitCollaborationReview,
  type CollaborationReview,
  type PendingReviewTarget,
} from "../api/projectHistory.api";
import { extractApiMessage } from "../api/http";

function formatPl(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL");
}

type ReviewDraft = {
  communicationRating: number;
  reliabilityRating: number;
  collaborationRating: number;
  ownershipRating: number;
  comment: string;
};

function emptyDraft(): ReviewDraft {
  return {
    communicationRating: 5,
    reliabilityRating: 5,
    collaborationRating: 5,
    ownershipRating: 5,
    comment: "",
  };
}

export default function History() {
  const [projectHistory, setProjectHistory] = useState<ProjectHistoryItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewTarget[]>([]);
  const [givenReviews, setGivenReviews] = useState<CollaborationReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<CollaborationReview[]>([]);

  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [profile, pending, given, received] = await Promise.all([
        getMyProfile(),
        fetchPendingReviews(),
        fetchGivenReviews(),
        fetchReceivedReviews(),
      ]);

      setProjectHistory(profile.projectHistory ?? []);
      setPendingReviews(pending ?? []);
      setGivenReviews(given ?? []);
      setReceivedReviews(received ?? []);
    } catch (e: unknown) {
      setError(`Nie udało się załadować historii pracy. ${extractApiMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const receivedAverage = useMemo(() => {
    if (!receivedReviews.length) return null;
    const avg =
      receivedReviews.reduce((sum, review) => sum + review.averageRating, 0) /
      receivedReviews.length;
    return Math.round(avg * 100) / 100;
  }, [receivedReviews]);

  function draftKey(item: PendingReviewTarget) {
    return `${item.teamId}-${item.reviewedUserId}`;
  }

  function getDraft(item: PendingReviewTarget) {
    return drafts[draftKey(item)] ?? emptyDraft();
  }

  function updateDraft(
    item: PendingReviewTarget,
    patch: Partial<ReviewDraft>
  ) {
    const key = draftKey(item);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? emptyDraft()),
        ...patch,
      },
    }));
  }

  async function handleSubmitReview(item: PendingReviewTarget) {
    const key = draftKey(item);
    const draft = getDraft(item);

    setSubmittingKey(key);
    setError("");
    setSuccessMsg("");

    try {
      await submitCollaborationReview({
        teamId: item.teamId,
        reviewedUserId: item.reviewedUserId,
        communicationRating: draft.communicationRating,
        reliabilityRating: draft.reliabilityRating,
        collaborationRating: draft.collaborationRating,
        ownershipRating: draft.ownershipRating,
        comment: draft.comment,
      });

      setSuccessMsg("Ocena współpracy została zapisana.");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      await load();
    } catch (e: unknown) {
      setError(`Nie udało się zapisać oceny współpracy. ${extractApiMessage(e)}`);
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Historia pracy</h2>
          <p className="card-subtitle">
            Zobacz zakończone projekty i wystaw oceny współpracy po zakończeniu pracy zespołowej.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
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
              <div className="muted">Ładowanie historii pracy…</div>
            </div>
          ) : (
            <>
              <div className="profile-block">
                <div className="profile-block-title">Podsumowanie ocen</div>
                <div className="muted">
                  Średnia ocen otrzymanych: {receivedAverage ?? "Brak danych"}
                </div>
              </div>

              <div className="profile-block">
                <div className="profile-block-title">
                  Projekty w historii ({projectHistory.length})
                </div>

                {projectHistory.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {projectHistory.map((item) => (
                      <div
                        key={`${item.teamId}-${item.joinedAt}-${item.roleLabel}`}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 14,
                          padding: 12,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <b>{item.teamName}</b>
                          <span className="pill">{item.roleLabel}</span>
                          <span className="pill">{item.teamStatus || "—"}</span>
                          {item.current && <span className="pill">aktywny</span>}
                        </div>

                        <div className="muted">
                          Dołączono: {formatPl(item.joinedAt)} | Zakończono: {item.current ? "—" : formatPl(item.leftAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">Brak historii projektów.</div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">
                  Oczekujące oceny współpracy ({pendingReviews.length})
                </div>

                {pendingReviews.length ? (
                  <div style={{ display: "grid", gap: 14 }}>
                    {pendingReviews.map((item) => {
                      const draft = getDraft(item);
                      const key = draftKey(item);

                      return (
                        <div
                          key={key}
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 14,
                            padding: 12,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <div>
                            <b>{item.teamName}</b> · {item.reviewedFullName}{" "}
                            <span className="muted">(@{item.reviewedUsername})</span>
                          </div>

                          <div className="muted">
                            Rola projektowa: {item.roleLabel || "—"} | Projekt zakończono: {formatPl(item.leftAt)}
                          </div>

                          <div className="form-grid-2">
                            <div className="field">
                              <label className="field-label">Komunikacja</label>
                              <select
                                className="input"
                                value={draft.communicationRating}
                                onChange={(e) =>
                                  updateDraft(item, {
                                    communicationRating: Number(e.target.value),
                                  })
                                }
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="field">
                              <label className="field-label">Rzetelność</label>
                              <select
                                className="input"
                                value={draft.reliabilityRating}
                                onChange={(e) =>
                                  updateDraft(item, {
                                    reliabilityRating: Number(e.target.value),
                                  })
                                }
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="field">
                              <label className="field-label">Współpraca</label>
                              <select
                                className="input"
                                value={draft.collaborationRating}
                                onChange={(e) =>
                                  updateDraft(item, {
                                    collaborationRating: Number(e.target.value),
                                  })
                                }
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="field">
                              <label className="field-label">Odpowiedzialność</label>
                              <select
                                className="input"
                                value={draft.ownershipRating}
                                onChange={(e) =>
                                  updateDraft(item, {
                                    ownershipRating: Number(e.target.value),
                                  })
                                }
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="field">
                            <label className="field-label">Komentarz</label>
                            <textarea
                              className="input"
                              rows={3}
                              value={draft.comment}
                              onChange={(e) =>
                                updateDraft(item, { comment: e.target.value })
                              }
                              placeholder="Napisz krótko, jak układała się współpraca."
                            />
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn-solid"
                              disabled={submittingKey === key}
                              onClick={() => void handleSubmitReview(item)}
                            >
                              {submittingKey === key ? "Zapisywanie…" : "Zapisz ocenę"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="muted">Brak oczekujących ocen współpracy.</div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">
                  Otrzymane oceny ({receivedReviews.length})
                </div>

                {receivedReviews.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {receivedReviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 14,
                          padding: 12,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <b>{review.teamName}</b>
                          <span className="pill">średnia: {review.averageRating}</span>
                          <span className="pill">od: @{review.reviewerUsername}</span>
                        </div>
                        <div className="muted">
                          Komunikacja: {review.communicationRating} | Rzetelność: {review.reliabilityRating} |
                          Współpraca: {review.collaborationRating} | Odpowiedzialność: {review.ownershipRating}
                        </div>
                        <div className="muted">{review.comment || "Brak komentarza."}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">Brak otrzymanych ocen.</div>
                )}
              </div>

              <div className="profile-block">
                <div className="profile-block-title">
                  Wystawione oceny ({givenReviews.length})
                </div>

                {givenReviews.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {givenReviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 14,
                          padding: 12,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <b>{review.teamName}</b>
                          <span className="pill">dla: {review.reviewedFullName}</span>
                          <span className="pill">średnia: {review.averageRating}</span>
                        </div>
                        <div className="muted">
                          Komunikacja: {review.communicationRating} | Rzetelność: {review.reliabilityRating} |
                          Współpraca: {review.collaborationRating} | Odpowiedzialność: {review.ownershipRating}
                        </div>
                        <div className="muted">{review.comment || "Brak komentarza."}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">Brak wystawionych ocen.</div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}