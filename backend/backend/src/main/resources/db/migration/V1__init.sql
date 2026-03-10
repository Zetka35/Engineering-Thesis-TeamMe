-- users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  selected_role VARCHAR(60),
  avatar_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- teams
CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- team memberships
CREATE TABLE team_members (
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_label VARCHAR(60) NOT NULL DEFAULT 'Member',
  PRIMARY KEY (team_id, user_id)
);

-- meetings
CREATE TABLE team_meetings (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL
);

-- mini-ipip surveys
CREATE TABLE mini_ipip_surveys (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers SMALLINT[] NOT NULL,
  top_roles JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);