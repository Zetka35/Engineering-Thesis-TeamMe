ALTER TABLE teams
    ADD COLUMN description TEXT,
    ADD COLUMN expected_time_text VARCHAR(120),
    ADD COLUMN max_members INTEGER NOT NULL DEFAULT 4 CHECK (max_members > 0),
    ADD COLUMN owner_user_id BIGINT REFERENCES users(id),
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER teams_updated
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE team_members
    ADD COLUMN joined_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE team_meetings
    ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT 'Spotkanie zespołu',
    ADD COLUMN description TEXT,
    ADD COLUMN ends_at TIMESTAMPTZ,
    ADD COLUMN location VARCHAR(200),
    ADD COLUMN created_by_user_id BIGINT REFERENCES users(id);

CREATE TABLE team_tasks (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignee_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    due_at TIMESTAMPTZ,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE'))
);

CREATE TRIGGER team_tasks_updated
BEFORE UPDATE ON team_tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_meetings_team_id ON team_meetings(team_id);
CREATE INDEX idx_team_meetings_starts_at ON team_meetings(starts_at);
CREATE INDEX idx_team_tasks_team_id ON team_tasks(team_id);
CREATE INDEX idx_team_tasks_assignee_user_id ON team_tasks(assignee_user_id);