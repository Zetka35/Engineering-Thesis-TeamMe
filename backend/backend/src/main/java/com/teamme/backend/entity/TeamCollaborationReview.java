package com.teamme.backend.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

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

    @Column(name = "communication_rating", nullable = false)
    private Integer communicationRating;

    @Column(name = "reliability_rating", nullable = false)
    private Integer reliabilityRating;

    @Column(name = "collaboration_rating", nullable = false)
    private Integer collaborationRating;

    @Column(name = "ownership_rating", nullable = false)
    private Integer ownershipRating;

    @Column(name = "comment")
    private String comment;

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

    public Integer getCommunicationRating() {
        return communicationRating;
    }

    public void setCommunicationRating(Integer communicationRating) {
        this.communicationRating = communicationRating;
    }

    public Integer getReliabilityRating() {
        return reliabilityRating;
    }

    public void setReliabilityRating(Integer reliabilityRating) {
        this.reliabilityRating = reliabilityRating;
    }

    public Integer getCollaborationRating() {
        return collaborationRating;
    }

    public void setCollaborationRating(Integer collaborationRating) {
        this.collaborationRating = collaborationRating;
    }

    public Integer getOwnershipRating() {
        return ownershipRating;
    }

    public void setOwnershipRating(Integer ownershipRating) {
        this.ownershipRating = ownershipRating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
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