ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS show_on_public_profile BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE team_recruitment_requests
ADD COLUMN IF NOT EXISTS show_on_public_profile BOOLEAN NOT NULL DEFAULT TRUE;