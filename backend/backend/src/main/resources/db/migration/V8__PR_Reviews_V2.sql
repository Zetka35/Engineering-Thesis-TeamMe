CREATE TABLE IF NOT EXISTS team_collaboration_reviews (
    id BIGSERIAL PRIMARY KEY,

    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    reviewer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    project_role_label VARCHAR(120) NOT NULL DEFAULT 'Member',

    engagement_rating INTEGER NOT NULL DEFAULT 5,
    role_execution_rating INTEGER NOT NULL DEFAULT 5,
    collaboration_rating INTEGER NOT NULL DEFAULT 5,
    reliability_rating INTEGER NOT NULL DEFAULT 5,
    contribution_quality_rating INTEGER NOT NULL DEFAULT 5,

    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_team_collaboration_review
        UNIQUE (team_id, reviewer_user_id, reviewed_user_id)
);

ALTER TABLE team_collaboration_reviews
    ADD COLUMN IF NOT EXISTS project_role_label VARCHAR(120);

ALTER TABLE team_collaboration_reviews
    ADD COLUMN IF NOT EXISTS engagement_rating INTEGER;

ALTER TABLE team_collaboration_reviews
    ADD COLUMN IF NOT EXISTS role_execution_rating INTEGER;

ALTER TABLE team_collaboration_reviews
    ADD COLUMN IF NOT EXISTS contribution_quality_rating INTEGER;

ALTER TABLE team_collaboration_reviews
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE team_collaboration_reviews
SET project_role_label = COALESCE(project_role_label, 'Member');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'team_collaboration_reviews'
          AND column_name = 'ownership_rating'
    ) THEN
        UPDATE team_collaboration_reviews
        SET engagement_rating = COALESCE(engagement_rating, ownership_rating, reliability_rating, collaboration_rating, 5);
    ELSE
        UPDATE team_collaboration_reviews
        SET engagement_rating = COALESCE(engagement_rating, reliability_rating, collaboration_rating, 5);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'team_collaboration_reviews'
          AND column_name = 'ownership_rating'
    ) THEN
        UPDATE team_collaboration_reviews
        SET role_execution_rating = COALESCE(role_execution_rating, reliability_rating, ownership_rating, 5);
    ELSE
        UPDATE team_collaboration_reviews
        SET role_execution_rating = COALESCE(role_execution_rating, reliability_rating, 5);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'team_collaboration_reviews'
          AND column_name = 'communication_rating'
    ) THEN
        UPDATE team_collaboration_reviews
        SET contribution_quality_rating = COALESCE(contribution_quality_rating, communication_rating, collaboration_rating, 5);
    ELSE
        UPDATE team_collaboration_reviews
        SET contribution_quality_rating = COALESCE(contribution_quality_rating, collaboration_rating, 5);
    END IF;
END $$;

UPDATE team_collaboration_reviews
SET updated_at = COALESCE(updated_at, now());

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN project_role_label SET DEFAULT 'Member',
    ALTER COLUMN project_role_label SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN engagement_rating SET DEFAULT 5,
    ALTER COLUMN engagement_rating SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN role_execution_rating SET DEFAULT 5,
    ALTER COLUMN role_execution_rating SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN collaboration_rating SET DEFAULT 5,
    ALTER COLUMN collaboration_rating SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN reliability_rating SET DEFAULT 5,
    ALTER COLUMN reliability_rating SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN contribution_quality_rating SET DEFAULT 5,
    ALTER COLUMN contribution_quality_rating SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE team_collaboration_reviews
    DROP COLUMN IF EXISTS communication_rating;

ALTER TABLE team_collaboration_reviews
    DROP COLUMN IF EXISTS ownership_rating;

CREATE TABLE IF NOT EXISTS team_collaboration_review_strength_tags (
    review_id BIGINT NOT NULL REFERENCES team_collaboration_reviews(id) ON DELETE CASCADE,
    tag VARCHAR(60) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_reviewed_user
    ON team_collaboration_reviews(reviewed_user_id);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_reviewer_user
    ON team_collaboration_reviews(reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_reviews_team
    ON team_collaboration_reviews(team_id);

CREATE INDEX IF NOT EXISTS idx_team_collaboration_review_strength_tags_review
    ON team_collaboration_review_strength_tags(review_id);