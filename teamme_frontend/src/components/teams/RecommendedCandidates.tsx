import React from "react";

export interface RecommendedCandidate {
  userId: number;
  username: string;
  fullName: string;
  selectedRole?: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

type Props = {
  candidates: RecommendedCandidate[];
  loading?: boolean;
  error?: string;
  onInviteCandidate?: (username: string) => void | Promise<void>;
};

export default function RecommendedCandidates({
  candidates,
  loading = false,
  error = "",
  onInviteCandidate,
}: Props) {
  return (
    <div className="profile-block">
      <div className="profile-block-title">Rekomendowani kandydaci</div>

      {loading ? (
        <div className="muted">Ładowanie rekomendacji…</div>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : candidates.length === 0 ? (
        <div className="muted">
          Brak rekomendacji kandydatów. Gdy backend wystawi endpoint matchingu, tutaj pojawi się ranking użytkowników.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {candidates.map((candidate) => (
            <div
              key={candidate.userId}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <b>{candidate.fullName}</b>
                <span className="muted">@{candidate.username}</span>
                {candidate.selectedRole && <span className="pill">{candidate.selectedRole}</span>}
                <span className="pill">dopasowanie: {candidate.score.toFixed(2)}</span>
              </div>

              {candidate.matchedSkills.length > 0 && (
                <div>
                  <b>Mocne dopasowanie:</b>{" "}
                  <span className="muted">{candidate.matchedSkills.join(", ")}</span>
                </div>
              )}

              {candidate.missingSkills.length > 0 && (
                <div>
                  <b>Braki:</b>{" "}
                  <span className="muted">{candidate.missingSkills.join(", ")}</span>
                </div>
              )}

              <div className="muted">{candidate.summary}</div>

              {onInviteCandidate && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => void onInviteCandidate(candidate.username)}
                  >
                    Zaproś do zespołu
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}