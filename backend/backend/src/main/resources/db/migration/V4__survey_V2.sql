CREATE TABLE team_role_surveys (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    survey_version SMALLINT NOT NULL DEFAULT 2,

    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),

    current_part VARCHAR(20) NOT NULL DEFAULT 'INTRO'
        CHECK (current_part IN ('INTRO', 'MINI_IPIP', 'TEAMWORK', 'RESULT')),

    current_page INTEGER NOT NULL DEFAULT 0
        CHECK (current_page >= 0),

    mini_ipip_draft_answers SMALLINT[],
    teamwork_draft_answers SMALLINT[],

    big_five_scores JSONB,
    teamwork_scores JSONB,
    role_scores JSONB,
    top_roles JSONB,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (
        mini_ipip_draft_answers IS NULL
        OR cardinality(mini_ipip_draft_answers) = 20
    ),
    CHECK (
        teamwork_draft_answers IS NULL
        OR cardinality(teamwork_draft_answers) = 12
    )
);

CREATE TRIGGER team_role_surveys_updated
BEFORE UPDATE ON team_role_surveys
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_team_role_surveys_status
    ON team_role_surveys(status);

CREATE INDEX idx_team_role_surveys_completed_at
    ON team_role_surveys(completed_at DESC NULLS LAST);