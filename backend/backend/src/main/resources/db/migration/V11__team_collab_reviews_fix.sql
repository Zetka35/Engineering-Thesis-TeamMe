ALTER TABLE team_collaboration_reviews
    ADD CONSTRAINT chk_review_engagement
    CHECK (engagement_rating BETWEEN 1 AND 5);

ALTER TABLE team_collaboration_reviews
    ADD CONSTRAINT chk_review_role_execution
    CHECK (role_execution_rating BETWEEN 1 AND 5);

ALTER TABLE team_collaboration_reviews
    ADD CONSTRAINT chk_review_contribution_quality
    CHECK (contribution_quality_rating BETWEEN 1 AND 5);

CREATE TRIGGER team_collaboration_reviews_updated
BEFORE UPDATE ON team_collaboration_reviews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

