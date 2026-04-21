ALTER TABLE team_role_requirements
    ADD COLUMN IF NOT EXISTS preferred_team_role VARCHAR(80);

ALTER TABLE team_role_requirements
    ADD COLUMN IF NOT EXISTS team_role_importance INTEGER NOT NULL DEFAULT 3;

UPDATE team_role_requirements
SET team_role_importance = 3
WHERE team_role_importance IS NULL;

UPDATE users
SET selected_role = 'Filar Wsparcia'
WHERE selected_role = 'Wspierający Zespołowy';

UPDATE users
SET selected_role = 'Łowca Informacji'
WHERE selected_role = 'Łącznik';