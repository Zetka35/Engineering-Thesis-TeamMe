ALTER TABLE users
    ADD COLUMN headline VARCHAR(160),
    ADD COLUMN location VARCHAR(120),
    ADD COLUMN availability_status VARCHAR(40),
    ADD COLUMN github_url TEXT,
    ADD COLUMN linkedin_url TEXT,
    ADD COLUMN portfolio_url TEXT;

ALTER TABLE team_members
    ADD COLUMN left_at TIMESTAMPTZ;

CREATE TABLE user_experiences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(160) NOT NULL,
    position VARCHAR(160) NOT NULL,
    employment_type VARCHAR(80),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TRIGGER user_experiences_updated
BEFORE UPDATE ON user_experiences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_educations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_name VARCHAR(160) NOT NULL,
    degree VARCHAR(120),
    field_of_study VARCHAR(160),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TRIGGER user_educations_updated
BEFORE UPDATE ON user_educations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_skills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    level INTEGER,
    category VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (level IS NULL OR (level >= 1 AND level <= 5))
);

CREATE TABLE user_languages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    level VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_members_user_id_left_at
    ON team_members(user_id, left_at);

CREATE INDEX idx_user_experiences_user_id
    ON user_experiences(user_id);

CREATE INDEX idx_user_experiences_dates
    ON user_experiences(user_id, start_date DESC, end_date DESC);

CREATE INDEX idx_user_educations_user_id
    ON user_educations(user_id);

CREATE INDEX idx_user_educations_dates
    ON user_educations(user_id, start_date DESC, end_date DESC);

CREATE INDEX idx_user_skills_user_id
    ON user_skills(user_id);

CREATE INDEX idx_user_languages_user_id
    ON user_languages(user_id);

CREATE INDEX idx_users_selected_role
    ON users(selected_role);

CREATE INDEX idx_users_availability_status
    ON users(availability_status);

CREATE UNIQUE INDEX uq_user_skills_user_lower_name
    ON user_skills(user_id, lower(name));

CREATE UNIQUE INDEX uq_user_languages_user_lower_name
    ON user_languages(user_id, lower(name));