package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamRecruitmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRecruitmentRequestRepository extends JpaRepository<TeamRecruitmentRequest, Long> {
    List<TeamRecruitmentRequest> findByTeam_IdOrderByCreatedAtDesc(Long teamId);

    List<TeamRecruitmentRequest> findByUser_UsernameOrderByCreatedAtDesc(String username);

    List<TeamRecruitmentRequest> findByUser_UsernameOrCreatedByUser_UsernameOrderByCreatedAtDesc(
            String username,
            String createdByUsername
    );

    List<TeamRecruitmentRequest> findByTeam_OwnerUser_UsernameOrderByCreatedAtDesc(String ownerUsername);

    Optional<TeamRecruitmentRequest> findByTeam_IdAndUser_IdAndStatus(Long teamId, Long userId, String status);
}