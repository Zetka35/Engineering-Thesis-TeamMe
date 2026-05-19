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

function formatRating(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2).replace(".", ",");
}

const RATING_VALUES = [1, 2, 3, 4, 5];

const STRENGTH_TAG_OPTIONS = [
  "komunikacja",
  "terminowość",
  "samodzielność",
  "inicjatywa",
  "wsparcie zespołu",
  "odpowiedzialność",
  "jakość rozwiązań",
];

type ReviewDraft = {
  engagementRating: number;
  roleExecutionRating: number;
  collaborationRating: number;
  reliabilityRating: number;
  contributionQualityRating: number;
  comment: string;
  strengthTags: string[];
};

function emptyDraft(): ReviewDraft {
  return {
    engagementRating: 5,
    roleExecutionRating: 5,
    collaborationRating: 5,
    reliabilityRating: 5,
    contributionQualityRating: 5,
    comment: "",
    strengthTags: [],
  };
}

function RatingSelect({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {description && (
        <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
          {description}
        </div>
      )}
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {RATING_VALUES.map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReviewRatingsSummary({ review }: { review: CollaborationReview }) {
  return (
    <div className="muted">
      Zaangażowanie: {review.engagementRating} | Realizacja roli:{" "}
      {review.roleExecutionRating} | Współpraca: {review.collaborationRating} |
      Odpowiedzialność: {review.reliabilityRating} | Jakość wkładu:{" "}
      {review.contributionQualityRating}
    </div>
  );
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

  function updateDraft(item: PendingReviewTarget, patch: Partial<ReviewDraft>) {
    const key = draftKey(item);

    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? emptyDraft()),
        ...patch,
      },
    }));
  }

  function toggleStrengthTag(item: PendingReviewTarget, tag: string) {
    const draft = getDraft(item);
    const selected = draft.strengthTags.includes(tag);

    if (selected) {
      updateDraft(item, {
        strengthTags: draft.strengthTags.filter((currentTag) => currentTag !== tag),
      });
      return;
    }

    if (draft.strengthTags.length >= 3) {
      setError("Możesz wskazać maksymalnie 3 mocne strony.");
      return;
    }

    setError("");
    updateDraft(item, {
      strengthTags: [...draft.strengthTags, tag],
    });
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
        engagementRating: draft.engagementRating,
        roleExecutionRating: draft.roleExecutionRating,
        collaborationRating: draft.collaborationRating,
        reliabilityRating: draft.reliabilityRating,
        contributionQualityRating: draft.contributionQualityRating,
        comment: draft.comment,
        strengthTags: draft.strengthTags,
      });

      setSuccessMsg("Ocena wkładu w projekt została zapisana.");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      await load();
    } catch (e: unknown) {
      setError(`Nie udało się zapisać oceny wkładu w projekt. ${extractApiMessage(e)}`);
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
            Zobacz zakończone projekty i wystaw oceny wkładu w projekt po zakończeniu pracy zespołowej.
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {successMsg && (
            <div
              className="alert alert-success"
              style={{
                background: "#ecfdf3",
                color: "#166534",
                borderColor: "#bbf7d0",
              }}
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
                  Średnia ocen otrzymanych:{" "}
                  {receivedAverage === null ? "Brak danych" : formatRating(receivedAverage)}
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
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <b>{item.teamName}</b>
                          <span className="pill">{item.roleLabel}</span>
                          <span className="pill">{item.teamStatus || "—"}</span>
                          {item.current && <span className="pill">aktywny</span>}
                        </div>

                        <span className="pill">
                        {item.showOnPublicProfile ? "widoczny publicznie" : "ukryty publicznie"}
                        </span>

                        <div className="muted">
                          Dołączono: {formatPl(item.joinedAt)} | Zakończono:{" "}
                          {item.current ? "—" : formatPl(item.leftAt)}
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
                  Oczekujące oceny wkładu w projekt ({pendingReviews.length})
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
                            gap: 12,
                          }}
                        >
                          <div>
                            <b>{item.teamName}</b> · {item.reviewedFullName}{" "}
                            <span className="muted">(@{item.reviewedUsername})</span>
                          </div>

                          <div className="muted">
                            Rola projektowa: {item.roleLabel || "—"} | Projekt zakończono:{" "}
                            {formatPl(item.leftAt)}
                          </div>

                          <div
                            style={{
                              background: "#f8fafc",
                              border: "1px solid var(--line)",
                              borderRadius: 12,
                              padding: 12,
                              display: "grid",
                              gap: 4,
                            }}
                          >
                            <b>Jak oceniasz wkład tej osoby w ten projekt?</b>
                            <span className="muted">
                              Oceń zachowanie i efekty pracy w kontekście konkretnego projektu oraz przyjętej roli.
                            </span>
                          </div>

                          <div className="form-grid-2">
                            <RatingSelect
                              label="Zaangażowanie w projekt"
                              description="Czy osoba realnie angażowała się w pracę, była aktywna i wnosiła wkład?"
                              value={draft.engagementRating}
                              onChange={(value) =>
                                updateDraft(item, { engagementRating: value })
                              }
                            />

                            <RatingSelect
                              label="Realizacja przyjętej roli"
                              description="Jak dobrze poradziła sobie w roli projektowej, którą pełniła?"
                              value={draft.roleExecutionRating}
                              onChange={(value) =>
                                updateDraft(item, { roleExecutionRating: value })
                              }
                            />

                            <RatingSelect
                              label="Współpraca zespołowa"
                              description="Jak układała się codzienna współpraca z tą osobą?"
                              value={draft.collaborationRating}
                              onChange={(value) =>
                                updateDraft(item, { collaborationRating: value })
                              }
                            />

                            <RatingSelect
                              label="Odpowiedzialność i terminowość"
                              description="Czy można było na niej polegać i czy domykała zadania?"
                              value={draft.reliabilityRating}
                              onChange={(value) =>
                                updateDraft(item, { reliabilityRating: value })
                              }
                            />

                            <RatingSelect
                              label="Jakość wkładu merytorycznego"
                              description="Czy jej rozwiązania, pomysły lub zadania były wartościowe?"
                              value={draft.contributionQualityRating}
                              onChange={(value) =>
                                updateDraft(item, { contributionQualityRating: value })
                              }
                            />
                          </div>

                          <div className="field">
                            <label className="field-label">
                              Najczęściej widoczne mocne strony — wybierz maksymalnie 3
                            </label>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {STRENGTH_TAG_OPTIONS.map((tag) => {
                                const selected = draft.strengthTags.includes(tag);

                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    className={selected ? "btn btn-solid" : "btn btn-ghost"}
                                    onClick={() => toggleStrengthTag(item, tag)}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
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
                              placeholder="Napisz krótko, jaki był wkład tej osoby w projekt."
                            />
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn-solid"
                              disabled={submittingKey === key}
                              onClick={() => void handleSubmitReview(item)}
                            >
                              {submittingKey === key
                                ? "Zapisywanie…"
                                : "Zapisz ocenę wkładu"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="muted">Brak oczekujących ocen wkładu w projekt.</div>
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
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <b>{review.teamName}</b>
                          <span className="pill">rola: {review.projectRoleLabel}</span>
                          <span className="pill">
                            średnia: {formatRating(review.averageRating)}
                          </span>
                          <span className="pill">od: @{review.reviewerUsername}</span>
                          {review.editable && <span className="pill">możliwa edycja</span>}
                        </div>

                        <ReviewRatingsSummary review={review} />

                        {review.strengthTags.length > 0 && (
                          <div className="muted">
                            Mocne strony: {review.strengthTags.join(", ")}
                          </div>
                        )}

                        <div className="muted">
                          {review.comment || "Brak komentarza."}
                        </div>
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
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <b>{review.teamName}</b>
                          <span className="pill">dla: {review.reviewedFullName}</span>
                          <span className="pill">rola: {review.projectRoleLabel}</span>
                          <span className="pill">
                            średnia: {formatRating(review.averageRating)}
                          </span>
                          {review.editable && <span className="pill">możliwa edycja</span>}
                        </div>

                        <ReviewRatingsSummary review={review} />

                        {review.strengthTags.length > 0 && (
                          <div className="muted">
                            Mocne strony: {review.strengthTags.join(", ")}
                          </div>
                        )}

                        <div className="muted">
                          {review.comment || "Brak komentarza."}
                        </div>
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