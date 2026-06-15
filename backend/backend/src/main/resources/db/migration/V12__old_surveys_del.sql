DROP TABLE IF EXISTS mini_ipip_surveys;

ALTER TABLE team_collaboration_review_strength_tags
ADD CONSTRAINT uq_review_strength_tag UNIQUE (review_id, tag);