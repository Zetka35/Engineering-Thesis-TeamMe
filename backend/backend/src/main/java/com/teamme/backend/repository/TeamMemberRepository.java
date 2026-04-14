package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamMember;
import com.teamme.backend.entity.TeamMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {
    List<TeamMember> findByTeam_IdOrderByUser_UsernameAsc(Long teamId);
    Optional<TeamMember> findByTeam_IdAndUser_Username(Long teamId, String username);
    boolean existsByTeam_IdAndUser_Username(Long teamId, String username);
    boolean existsByTeam_IdAndUser_Id(Long teamId, Long userId);
    long countByTeam_Id(Long teamId);

    List<TeamMember> findByUser_UsernameOrderByJoinedAtDesc(String username);
    Optional<TeamMember> findFirstByUser_IdAndLeftAtIsNullOrderByJoinedAtDesc(Long userId);
    Optional<TeamMember> findFirstByUser_IdOrderByJoinedAtDesc(Long userId);
}