package com.teamme.backend.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "team_members")
public class TeamMember {
    @EmbeddedId
    private TeamMemberId id = new TeamMemberId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "role_label", nullable = false, length = 60)
    private String roleLabel = "Member";

    @Column(name = "team_role_label", length = 80)
    private String teamRoleLabel;
    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime joinedAt;

    @Column(name = "left_at")
    private OffsetDateTime leftAt;

    @Column(name = "show_on_public_profile", nullable = false)
    private boolean showOnPublicProfile = true;

    public TeamMemberId getId() { return id; }
    public void setId(TeamMemberId id) { this.id = id; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRoleLabel() { return roleLabel; }
    public void setRoleLabel(String roleLabel) { this.roleLabel = roleLabel; }

    public String getTeamRoleLabel() {
        return teamRoleLabel;
    }

    public void setTeamRoleLabel(String teamRoleLabel) {
        this.teamRoleLabel = teamRoleLabel;
    }

    public OffsetDateTime getJoinedAt() { return joinedAt; }

    public OffsetDateTime getLeftAt() { return leftAt; }
    public void setLeftAt(OffsetDateTime leftAt) { this.leftAt = leftAt; }

    public boolean isShowOnPublicProfile() {
        return showOnPublicProfile;
    }

    public void setShowOnPublicProfile(boolean showOnPublicProfile) {
        this.showOnPublicProfile = showOnPublicProfile;
    }
}