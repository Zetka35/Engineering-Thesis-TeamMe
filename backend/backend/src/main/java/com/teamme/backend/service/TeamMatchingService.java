package com.teamme.backend.service;

import com.teamme.backend.entity.Team;
import com.teamme.backend.entity.TeamMember;
import com.teamme.backend.entity.TeamRoleRequirement;
import com.teamme.backend.entity.TeamTechnology;
import com.teamme.backend.entity.User;
import com.teamme.backend.entity.UserExperience;
import com.teamme.backend.entity.UserSkill;
import com.teamme.backend.repository.TeamMemberRepository;
import com.teamme.backend.repository.TeamRepository;
import com.teamme.backend.repository.TeamRoleRequirementRepository;
import com.teamme.backend.repository.TeamTechnologyRepository;
import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class TeamMatchingService {

    public record MatchScoreView(
            Long userId,
            String username,
            String fullName,
            String selectedTeamRole,
            String matchedProjectRoleName,
            double score,
            List<String> matchedSkills,
            List<String> missingSkills,
            String summary
    ) {}

    private record RequirementFit(
            TeamRoleRequirement requirement,
            double teamRoleScore,
            String explanation
    ) {}

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamTechnologyRepository teamTechnologyRepository;
    private final TeamRoleRequirementRepository teamRoleRequirementRepository;
    private final UserRepository userRepository;

    public TeamMatchingService(
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TeamTechnologyRepository teamTechnologyRepository,
            TeamRoleRequirementRepository teamRoleRequirementRepository,
            UserRepository userRepository
    ) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamTechnologyRepository = teamTechnologyRepository;
        this.teamRoleRequirementRepository = teamRoleRequirementRepository;
        this.userRepository = userRepository;
    }

    public List<MatchScoreView> recommendUsersForTeam(Long teamId, String username) {
        Team team = loadTeam(teamId);
        ensureOwner(team, username);

        List<TeamTechnology> technologies = teamTechnologyRepository.findByTeam_IdOrderByNameAsc(teamId);
        List<TeamRoleRequirement> openRequirements =
                teamRoleRequirementRepository.findByTeam_IdOrderByPriorityDescProjectRoleNameAsc(teamId).stream()
                        .filter(r -> "OPEN".equals(r.getStatus()))
                        .toList();

        Set<Long> currentMemberIds = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(teamId).stream()
                .map(tm -> tm.getUser().getId())
                .collect(Collectors.toSet());

        return userRepository.findAll().stream()
                .filter(u -> !currentMemberIds.contains(u.getId()))
                .filter(u -> team.getOwnerUser() == null || !u.getId().equals(team.getOwnerUser().getId()))
                .map(u -> scoreUserForTeam(u, team, technologies, openRequirements))
                .sorted(Comparator.comparing(MatchScoreView::score).reversed()
                        .thenComparing(MatchScoreView::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private MatchScoreView scoreUserForTeam(
            User user,
            Team team,
            List<TeamTechnology> technologies,
            List<TeamRoleRequirement> openRequirements
    ) {
        List<String> requiredTech = technologies.stream()
                .filter(TeamTechnology::isRequired)
                .map(TeamTechnology::getName)
                .filter(x -> x != null && !x.isBlank())
                .distinct()
                .toList();

        Set<String> userSkills = user.getSkills().stream()
                .map(UserSkill::getName)
                .filter(x -> x != null && !x.isBlank())
                .map(this::normalizeKey)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> matchedSkills = requiredTech.stream()
                .filter(t -> userSkills.contains(normalizeKey(t)))
                .distinct()
                .toList();

        List<String> missingSkills = requiredTech.stream()
                .filter(t -> !userSkills.contains(normalizeKey(t)))
                .distinct()
                .toList();

        RequirementFit requirementFit = findBestRequirementForUser(user, openRequirements);

        double technicalScore = computeTechnicalScore(requiredTech, matchedSkills);
        double experienceScore = computeExperienceScore(team.getExperienceLevel(), user.getExperiences());
        double availabilityScore = computeAvailabilityScore(user.getAvailabilityStatus());
        double total = round2(
                technicalScore +
                        experienceScore +
                        availabilityScore +
                        requirementFit.teamRoleScore()
        );

        String summary = buildSummary(
                user,
                requirementFit,
                matchedSkills,
                missingSkills,
                team.getExperienceLevel()
        );

        return new MatchScoreView(
                user.getId(),
                user.getUsername(),
                fullName(user),
                user.getSelectedRole(),
                requirementFit.requirement() == null ? null : requirementFit.requirement().getProjectRoleName(),
                total,
                matchedSkills,
                missingSkills,
                summary
        );
    }

    private RequirementFit findBestRequirementForUser(User user, List<TeamRoleRequirement> openRequirements) {
        if (openRequirements.isEmpty()) {
            return new RequirementFit(null, 6.0, "zespół nie ma jeszcze zdefiniowanych otwartych ról projektowych");
        }

        TeamRoleRequirement bestRequirement = null;
        double bestScore = Double.NEGATIVE_INFINITY;
        String bestExplanation = "";

        for (TeamRoleRequirement requirement : openRequirements) {
            double teamRoleScore = computeTeamRoleScore(
                    user.getSelectedRole(),
                    requirement.getPreferredTeamRole(),
                    requirement.getTeamRoleImportance()
            );

            double weightedScore = teamRoleScore + ((requirement.getPriority() == null ? 3 : requirement.getPriority()) * 0.5);

            if (weightedScore > bestScore) {
                bestScore = weightedScore;
                bestRequirement = requirement;
                bestExplanation = buildRequirementExplanation(user.getSelectedRole(), requirement);
            }
        }

        return new RequirementFit(bestRequirement, round2(bestScore), bestExplanation);
    }

    private double computeTechnicalScore(List<String> requiredTech, List<String> matchedSkills) {
        if (requiredTech.isEmpty()) return 25.0;

        double ratio = (double) matchedSkills.size() / (double) requiredTech.size();
        return round2(ratio * 45.0);
    }

    private double computeTeamRoleScore(
            String userTeamRole,
            String preferredTeamRole,
            Integer teamRoleImportance
    ) {
        int importance = teamRoleImportance == null ? 3 : teamRoleImportance;

        if (preferredTeamRole == null || preferredTeamRole.isBlank()) {
            return 8.0;
        }

        if (userTeamRole == null || userTeamRole.isBlank()) {
            return 2.0 + importance;
        }

        if (equalsIgnoreCase(userTeamRole, preferredTeamRole)) {
            return round2(8.0 + importance * 2.4);
        }

        return round2(Math.max(1.0, 6.0 - importance));
    }

    private double computeExperienceScore(String expectedLevel, List<UserExperience> experiences) {
        int rank = inferUserExperienceRank(experiences);
        int expectedRank = switch (expectedLevel == null ? "MIXED" : expectedLevel) {
            case "BEGINNER" -> 0;
            case "JUNIOR" -> 1;
            case "MID" -> 2;
            case "SENIOR" -> 3;
            case "MIXED" -> 1;
            default -> 1;
        };

        if ("MIXED".equals(expectedLevel)) {
            return 10.0;
        }

        int diff = rank - expectedRank;
        if (diff >= 0) return 15.0;
        if (diff == -1) return 9.0;
        return 3.0;
    }

    private int inferUserExperienceRank(List<UserExperience> experiences) {
        long count = experiences.stream()
                .filter(e -> e.getCompanyName() != null && !e.getCompanyName().isBlank())
                .count();

        if (count == 0) return 0;
        if (count == 1) return 1;
        if (count == 2) return 2;
        return 3;
    }

    private double computeAvailabilityScore(String availabilityStatus) {
        if (availabilityStatus == null || availabilityStatus.isBlank()) return 4.0;

        return switch (availabilityStatus) {
            case "OPEN_TO_PROJECTS" -> 10.0;
            case "LIMITED_AVAILABILITY" -> 6.0;
            case "NOT_AVAILABLE" -> 0.0;
            default -> 4.0;
        };
    }

    private String buildRequirementExplanation(String userTeamRole, TeamRoleRequirement requirement) {
        if (requirement.getPreferredTeamRole() == null || requirement.getPreferredTeamRole().isBlank()) {
            return "dla tej roli projektowej nie ustawiono preferowanej roli zespołowej";
        }

        if (userTeamRole == null || userTeamRole.isBlank()) {
            return "użytkownik nie ma jeszcze przypisanej roli zespołowej w profilu";
        }

        if (equalsIgnoreCase(userTeamRole, requirement.getPreferredTeamRole())) {
            return "rola zespołowa użytkownika pokrywa się z preferencją dla tej pozycji";
        }

        return "rola zespołowa użytkownika różni się od preferowanej dla tej pozycji";
    }

    private String buildSummary(
            User user,
            RequirementFit requirementFit,
            List<String> matchedSkills,
            List<String> missingSkills,
            String expectedLevel
    ) {
        StringBuilder summary = new StringBuilder();

        if (requirementFit.requirement() != null) {
            summary.append("najlepiej pasuje do roli projektowej: ")
                    .append(requirementFit.requirement().getProjectRoleName());

            if (requirementFit.requirement().getPreferredTeamRole() != null &&
                    !requirementFit.requirement().getPreferredTeamRole().isBlank()) {
                summary.append("; preferowana rola zespołowa dla tej pozycji: ")
                        .append(requirementFit.requirement().getPreferredTeamRole());
            }

            summary.append("; ").append(requirementFit.explanation());
        } else {
            summary.append("zespół nie ma jeszcze zdefiniowanych ról projektowych");
        }

        if (!matchedSkills.isEmpty()) {
            summary.append("; pokrycie technologii: ").append(String.join(", ", matchedSkills));
        }

        if (!missingSkills.isEmpty()) {
            summary.append("; braki technologiczne: ").append(String.join(", ", missingSkills));
        }

        summary.append("; oczekiwany poziom doświadczenia zespołu: ")
                .append(expectedLevel == null ? "MIXED" : expectedLevel);

        return summary.toString();
    }

    private Team loadTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zespołu."));
    }

    private void ensureOwner(Team team, String username) {
        if (team.getOwnerUser() == null || !username.equals(team.getOwnerUser().getUsername())) {
            throw new IllegalArgumentException("Tylko właściciel zespołu może przeglądać rekomendacje kandydatów.");
        }
    }

    private String fullName(User user) {
        String value = Stream.of(user.getFirstName(), user.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "))
                .trim();

        return value.isBlank() ? user.getUsername() : value;
    }

    private String normalizeKey(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) return false;
        return left.trim().equalsIgnoreCase(right.trim());
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}