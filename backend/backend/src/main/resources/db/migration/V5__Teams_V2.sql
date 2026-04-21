ALTER TABLE teams
    ADD COLUMN project_area VARCHAR(120),
    ADD COLUMN experience_level VARCHAR(20) NOT NULL DEFAULT 'MIXED',
    ADD COLUMN recruitment_status VARCHAR(20) NOT NULL DEFAULT 'OPEN';

ALTER TABLE teams
    ADD CONSTRAINT chk_teams_experience_level
    CHECK (experience_level IN ('BEGINNER', 'JUNIOR', 'MID', 'SENIOR', 'MIXED'));

ALTER TABLE teams
    ADD CONSTRAINT chk_teams_recruitment_status
    CHECK (recruitment_status IN ('OPEN', 'PAUSED', 'CLOSED', 'FULL'));

CREATE TABLE team_technologies (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    required_level INTEGER,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (required_level IS NULL OR (required_level >= 1 AND required_level <= 5))
);

CREATE TABLE team_role_requirements (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_name VARCHAR(80) NOT NULL,
    slots INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (slots > 0),
    CHECK (priority BETWEEN 1 AND 5),
    CHECK (status IN ('OPEN', 'FILLED', 'CLOSED'))
);

CREATE TABLE team_recruitment_requests (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    target_role_name VARCHAR(80),
    message TEXT,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    responded_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    CHECK (request_type IN ('APPLICATION', 'INVITATION')),
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX idx_teams_project_area
    ON teams(project_area);

CREATE INDEX idx_teams_recruitment_status
    ON teams(recruitment_status);

CREATE INDEX idx_team_technologies_team_id
    ON team_technologies(team_id);

CREATE UNIQUE INDEX uq_team_technologies_team_name
    ON team_technologies(team_id, lower(name));

CREATE INDEX idx_team_role_requirements_team_id
    ON team_role_requirements(team_id);

CREATE UNIQUE INDEX uq_team_role_requirements_team_role
    ON team_role_requirements(team_id, lower(role_name));

CREATE INDEX idx_team_recruitment_requests_team_id
    ON team_recruitment_requests(team_id);

CREATE INDEX idx_team_recruitment_requests_user_id
    ON team_recruitment_requests(user_id);

CREATE INDEX idx_team_recruitment_requests_status
    ON team_recruitment_requests(status);

CREATE UNIQUE INDEX uq_team_recruitment_pending_per_team_user
    ON team_recruitment_requests(team_id, user_id)
    WHERE status = 'PENDING';