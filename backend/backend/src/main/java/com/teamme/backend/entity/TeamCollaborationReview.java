package com.teamme.backend.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "team_collaboration_reviews",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_team_collaboration_review",
                        columnNames = {"team_id", "reviewer_user_id", "reviewed_user_id"}
                )
        }
)
public class TeamCollaborationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private User reviewerUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewed_user_id", nullable = false)
    private User reviewedUser;

    /**
     * Snapshot roli projektowej ocenianej osoby w momencie wystawiania oceny.
     * Dzięki temu późniejsza zmiana członkostwa/roli w zespole nie zmienia historii ocen.
     */
    @Column(name = "project_role_label", nullable = false, length = 120)
    private String projectRoleLabel = "Member";

    /**
     * Zaangażowanie w projekt.
     */
    @Column(name = "engagement_rating", nullable = false)
    private Integer engagementRating;

    /**
     * Realizacja przyjętej roli projektowej.
     */
    @Column(name = "role_execution_rating", nullable = false)
    private Integer roleExecutionRating;

    /**
     * Współpraca zespołowa.
     */
    @Column(name = "collaboration_rating", nullable = false)
    private Integer collaborationRating;

    /**
     * Odpowiedzialność i terminowość.
     */
    @Column(name = "reliability_rating", nullable = false)
    private Integer reliabilityRating;

    /**
     * Jakość wkładu merytorycznego.
     */
    @Column(name = "contribution_quality_rating", nullable = false)
    private Integer contributionQualityRating;

    @Column(name = "comment")
    private String comment;

    @ElementCollection
    @CollectionTable(
            name = "team_collaboration_review_strength_tags",
            joinColumns = @JoinColumn(name = "review_id")
    )
    @Column(name = "tag", nullable = false, length = 60)
    private List<String> strengthTags = new ArrayList<>();

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public User getReviewerUser() {
        return reviewerUser;
    }

    public void setReviewerUser(User reviewerUser) {
        this.reviewerUser = reviewerUser;
    }

    public User getReviewedUser() {
        return reviewedUser;
    }

    public void setReviewedUser(User reviewedUser) {
        this.reviewedUser = reviewedUser;
    }

    public String getProjectRoleLabel() {
        return projectRoleLabel;
    }

    public void setProjectRoleLabel(String projectRoleLabel) {
        this.projectRoleLabel = projectRoleLabel;
    }

    public Integer getEngagementRating() {
        return engagementRating;
    }

    public void setEngagementRating(Integer engagementRating) {
        this.engagementRating = engagementRating;
    }

    public Integer getRoleExecutionRating() {
        return roleExecutionRating;
    }

    public void setRoleExecutionRating(Integer roleExecutionRating) {
        this.roleExecutionRating = roleExecutionRating;
    }

    public Integer getCollaborationRating() {
        return collaborationRating;
    }

    public void setCollaborationRating(Integer collaborationRating) {
        this.collaborationRating = collaborationRating;
    }

    public Integer getReliabilityRating() {
        return reliabilityRating;
    }

    public void setReliabilityRating(Integer reliabilityRating) {
        this.reliabilityRating = reliabilityRating;
    }

    public Integer getContributionQualityRating() {
        return contributionQualityRating;
    }

    public void setContributionQualityRating(Integer contributionQualityRating) {
        this.contributionQualityRating = contributionQualityRating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }



    public List<String> getStrengthTags() {
        if (strengthTags == null) {
            strengthTags = new ArrayList<>();
        }
        return strengthTags;
    }

    public void setStrengthTags(List<String> strengthTags) {
        this.strengthTags = strengthTags == null ? new ArrayList<>() : new ArrayList<>(strengthTags);
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}