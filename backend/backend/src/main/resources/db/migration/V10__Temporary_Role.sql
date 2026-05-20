ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS team_role_label VARCHAR(80);

ALTER TABLE team_recruitment_requests
ADD COLUMN IF NOT EXISTS team_role_label VARCHAR(80);