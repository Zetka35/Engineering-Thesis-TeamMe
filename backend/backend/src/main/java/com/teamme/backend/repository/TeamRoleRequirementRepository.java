package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamRoleRequirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRoleRequirementRepository extends JpaRepository<TeamRoleRequirement, Long> {
    List<TeamRoleRequirement> findByTeam_IdOrderByPriorityDescRoleNameAsc(Long teamId);
    void deleteByTeam_Id(Long teamId);
}