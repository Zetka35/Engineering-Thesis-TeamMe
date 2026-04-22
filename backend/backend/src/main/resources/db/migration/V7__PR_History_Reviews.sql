CREATE TABLE IF NOT EXISTS team_collaboration_reviews (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    reviewer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    communication_rating INTEGER NOT NULL,
    reliability_rating INTEGER NOT NULL,
    collaboration_rating INTEGER NOT NULL,
    ownership_rating INTEGER NOT NULL,

    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_team_collaboration_review UNIQUE (team_id, reviewer_user_id, reviewed_user_id),
    CONSTRAINT chk_team_collaboration_review_not_self CHECK (reviewer_user_id <> reviewed_user_id),
    CONSTRAINT chk_team_collaboration_review_communication CHECK (communication_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_team_collaboration_review_reliability CHECK (reliability_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_team_collaboration_review_collaboration CHECK (collaboration_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_team_collaboration_review_ownership CHECK (ownership_rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_team_id
    ON team_collaboration_reviews(team_id);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_reviewer_user_id
    ON team_collaboration_reviews(reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_reviewed_user_id
    ON team_collaboration_reviews(reviewed_user_id);