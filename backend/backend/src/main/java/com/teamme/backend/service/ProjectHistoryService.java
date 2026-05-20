package com.teamme.backend.service;

import com.teamme.backend.entity.Team;
import com.teamme.backend.entity.TeamCollaborationReview;
import com.teamme.backend.entity.TeamMember;
import com.teamme.backend.entity.User;
import com.teamme.backend.repository.TeamCollaborationReviewRepository;
import com.teamme.backend.repository.TeamMemberRepository;
import com.teamme.backend.repository.TeamRepository;
import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class ProjectHistoryService {

    private static final int REVIEW_EDIT_WINDOW_DAYS = 7;
    private static final int MAX_STRENGTH_TAGS = 3;

    public record PendingReviewTargetView(
            Long teamId,
            String teamName,
            Long reviewedUserId,
            String reviewedUsername,
            String reviewedFullName,
            String roleLabel,
            String teamRoleLabel,
            String leftAt
    ) {}

    public record CollaborationReviewInput(
            Long teamId,
            Long reviewedUserId,
            Integer engagementRating,
            Integer roleExecutionRating,
            Integer collaborationRating,
            Integer reliabilityRating,
            Integer contributionQualityRating,
            String comment,
            List<String> strengthTags
    ) {}

    public record CollaborationReviewView(
            Long id,
            Long teamId,
            String teamName,
            Long reviewerUserId,
            String reviewerUsername,
            Long reviewedUserId,
            String reviewedUsername,
            String reviewedFullName,
            String projectRoleLabel
            String reviewedTeamRoleLabel,
            Integer engagementRating,
            Integer roleExecutionRating,
            Integer collaborationRating,
            Integer reliabilityRating,
            Integer contributionQualityRating,
            double averageRating,
            String comment,
            List<String> strengthTags,
            String createdAt,
            String updatedAt,
            boolean editable
    ) {}

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamCollaborationReviewRepository reviewRepository;

    public ProjectHistoryService(
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TeamCollaborationReviewRepository reviewRepository
    ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public List<PendingReviewTargetView> getPendingReviews(String username) {
        User reviewer = loadUser(username);

        List<TeamMember> myMemberships = teamMemberRepository.findByUser_UsernameOrderByJoinedAtDesc(username).stream()
                .filter(m -> m.getLeftAt() != null)
                .filter(m -> m.getTeam() != null)
                .filter(m -> "COMPLETED".equals(m.getTeam().getStatus()))
                .toList();

        List<PendingReviewTargetView> result = new ArrayList<>();

        for (TeamMember membership : myMemberships) {
            Team team = membership.getTeam();

            List<TeamMember> teammates = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(team.getId()).stream()
                    .filter(tm -> tm.getUser() != null)
                    .filter(tm -> !tm.getUser().getId().equals(reviewer.getId()))
                    .toList();

            for (TeamMember teammate : teammates) {
                boolean alreadyReviewed = reviewRepository
                        .findByTeam_IdAndReviewerUser_IdAndReviewedUser_Id(
                                team.getId(),
                                reviewer.getId(),
                                teammate.getUser().getId()
                        )
                        .isPresent();

                if (!alreadyReviewed) {
                    result.add(new PendingReviewTargetView(
                            team.getId(),
                            team.getName(),
                            teammate.getUser().getId(),
                            teammate.getUser().getUsername(),
                            fullName(teammate.getUser()),
                            teammate.getRoleLabel(),
                            teammate.getUser().getSelectedRole(),
                            membership.getLeftAt() == null ? null : membership.getLeftAt().toString()
                    ));
                }
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<CollaborationReviewView> getGivenReviews(String username) {
        return reviewRepository.findByReviewerUser_UsernameOrderByCreatedAtDesc(username).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CollaborationReviewView> getReceivedReviews(String username) {
        return reviewRepository.findByReviewedUser_UsernameOrderByCreatedAtDesc(username).stream()
                .map(this::toView)
                .toList();
    }

    public CollaborationReviewView saveReview(String username, CollaborationReviewInput req) {
        User reviewer = loadUser(username);

        if (req.teamId() == null) {
            throw new IllegalArgumentException("Id projektu jest wymagane.");
        }
        if (req.reviewedUserId() == null) {
            throw new IllegalArgumentException("Id ocenianego użytkownika jest wymagane.");
        }
        if (reviewer.getId().equals(req.reviewedUserId())) {
            throw new IllegalArgumentException("Nie możesz oceniać samego siebie.");
        }

        Team team = teamRepository.findById(req.teamId())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono projektu."));

        if (!"COMPLETED".equals(team.getStatus())) {
            throw new IllegalArgumentException("Oceny wkładu w projekt można wystawiać dopiero po zakończeniu projektu.");
        }

        User reviewedUser = userRepository.findById(req.reviewedUserId())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono ocenianego użytkownika."));

        TeamMember reviewerMembership = loadMembershipOrThrow(
                team.getId(),
                reviewer.getId(),
                "Nie należałeś/aś do tego projektu."
        );

        TeamMember reviewedMembership = loadMembershipOrThrow(
                team.getId(),
                reviewedUser.getId(),
                "Oceniany użytkownik nie należał do tego projektu."
        );

        validateRating(req.engagementRating(), "Ocena zaangażowania w projekt");
        validateRating(req.roleExecutionRating(), "Ocena realizacji przyjętej roli");
        validateRating(req.collaborationRating(), "Ocena współpracy zespołowej");
        validateRating(req.reliabilityRating(), "Ocena odpowiedzialności i terminowości");
        validateRating(req.contributionQualityRating(), "Ocena jakości wkładu merytorycznego");

        List<String> normalizedStrengthTags = normalizeStrengthTags(req.strengthTags());

        var existingReview = reviewRepository
                .findByTeam_IdAndReviewerUser_IdAndReviewedUser_Id(
                        team.getId(),
                        reviewer.getId(),
                        reviewedUser.getId()
                );

        existingReview.ifPresent(this::ensureEditable);

        TeamCollaborationReview review = existingReview.orElseGet(TeamCollaborationReview::new);

        review.setTeam(team);
        review.setReviewerUser(reviewer);
        review.setReviewedUser(reviewedUser);

        String projectRoleLabel = normalize(reviewedMembership.getRoleLabel(), 120);
        review.setProjectRoleLabel(projectRoleLabel == null ? "Member" : projectRoleLabel);

        review.setEngagementRating(req.engagementRating());
        review.setRoleExecutionRating(req.roleExecutionRating());
        review.setCollaborationRating(req.collaborationRating());
        review.setReliabilityRating(req.reliabilityRating());
        review.setContributionQualityRating(req.contributionQualityRating());

        review.setComment(normalize(req.comment(), 4000));
        review.setStrengthTags(normalizedStrengthTags);
        review.setUpdatedAt(OffsetDateTime.now());

        return toView(reviewRepository.save(review));
    }

    private CollaborationReviewView toView(TeamCollaborationReview review) {
        double avg = (
                review.getEngagementRating()
                        + review.getRoleExecutionRating()
                        + review.getCollaborationRating()
                        + review.getReliabilityRating()
                        + review.getContributionQualityRating()
        ) / 5.0;

        return new CollaborationReviewView(
                review.getId(),
                review.getTeam().getId(),
                review.getTeam().getName(),
                review.getReviewerUser().getId(),
                review.getReviewerUser().getUsername(),
                review.getReviewedUser().getId(),
                review.getReviewedUser().getUsername(),
                fullName(review.getReviewedUser()),
                review.getProjectRoleLabel(),
                review.getReviewedUser().getSelectedRole(),
                review.getEngagementRating(),
                review.getRoleExecutionRating(),
                review.getCollaborationRating(),
                review.getReliabilityRating(),
                review.getContributionQualityRating(),
                Math.round(avg * 100.0) / 100.0,
                review.getComment(),
                new ArrayList<>(review.getStrengthTags()),
                review.getCreatedAt() == null ? null : review.getCreatedAt().toString(),
                review.getUpdatedAt() == null ? null : review.getUpdatedAt().toString(),
                isEditable(review)
        );
    }

    private void validateRating(Integer value, String label) {
        if (value == null || value < 1 || value > 5) {
            throw new IllegalArgumentException(label + " musi być w zakresie 1-5.");
        }
    }

    private void ensureEditable(TeamCollaborationReview review) {
        if (!isEditable(review)) {
            throw new IllegalArgumentException(
                    "Ocena może być edytowana tylko przez " + REVIEW_EDIT_WINDOW_DAYS + " dni od wystawienia."
            );
        }
    }

    private boolean isEditable(TeamCollaborationReview review) {
        if (review.getCreatedAt() == null) {
            return true;
        }

        OffsetDateTime editDeadline = review.getCreatedAt().plusDays(REVIEW_EDIT_WINDOW_DAYS);
        return !OffsetDateTime.now().isAfter(editDeadline);
    }

    private TeamMember loadMembershipOrThrow(Long teamId, Long userId, String message) {
        return teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(teamId).stream()
                .filter(tm -> tm.getUser() != null)
                .filter(tm -> userId.equals(tm.getUser().getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(message));
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));
    }

    private String fullName(User user) {
        String value = Stream.of(user.getFirstName(), user.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "))
                .trim();
        return value.isBlank() ? user.getUsername() : value;
    }

    private List<String> normalizeStrengthTags(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<String> unique = new LinkedHashSet<>();

        for (String value : values) {
            String normalized = normalize(value, 60);
            if (normalized != null) {
                unique.add(normalized.toLowerCase());
            }

            if (unique.size() >= MAX_STRENGTH_TAGS) {
                break;
            }
        }

        return new ArrayList<>(unique);
    }

    private String normalize(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;
    }
}