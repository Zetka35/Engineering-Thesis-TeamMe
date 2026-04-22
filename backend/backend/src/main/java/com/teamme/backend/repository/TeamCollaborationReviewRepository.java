package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamCollaborationReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamCollaborationReviewRepository extends JpaRepository<TeamCollaborationReview, Long> {

    Optional<TeamCollaborationReview> findByTeam_IdAndReviewerUser_IdAndReviewedUser_Id(
            Long teamId,
            Long reviewerUserId,
            Long reviewedUserId
    );

    List<TeamCollaborationReview> findByReviewerUser_UsernameOrderByCreatedAtDesc(String username);

    List<TeamCollaborationReview> findByReviewedUser_UsernameOrderByCreatedAtDesc(String username);
}