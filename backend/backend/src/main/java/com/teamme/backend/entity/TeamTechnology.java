package com.teamme.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "team_technologies")
public class TeamTechnology {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Column(name = "required_level")
    private Integer requiredLevel;

    @Column(name = "is_required", nullable = false)
    private boolean required = true;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Long getId() { return id; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getRequiredLevel() { return requiredLevel; }
    public void setRequiredLevel(Integer requiredLevel) { this.requiredLevel = requiredLevel; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}