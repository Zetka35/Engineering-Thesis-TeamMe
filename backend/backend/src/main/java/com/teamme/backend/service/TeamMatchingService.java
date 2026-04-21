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

import java.util.ArrayList;
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
            String selectedRole,
            double score,
            List<String> matchedSkills,
            List<String> missingSkills,
            String summary
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
        List<TeamRoleRequirement> roleRequirements =
                teamRoleRequirementRepository.findByTeam_IdOrderByPriorityDescRoleNameAsc(teamId);

        Set<Long> currentMemberIds = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(teamId).stream()
                .map(tm -> tm.getUser().getId())
                .collect(Collectors.toSet());

        return userRepository.findAll().stream()
                .filter(u -> !currentMemberIds.contains(u.getId()))
                .filter(u -> team.getOwnerUser() == null || !u.getId().equals(team.getOwnerUser().getId()))
                .map(u -> scoreUserForTeam(u, team, technologies, roleRequirements))
                .sorted(Comparator.comparing(MatchScoreView::score).reversed()
                        .thenComparing(MatchScoreView::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private MatchScoreView scoreUserForTeam(
            User user,
            Team team,
            List<TeamTechnology> technologies,
            List<TeamRoleRequirement> roleRequirements
    ) {
        List<String> openRoles = roleRequirements.stream()
                .filter(r -> !"CLOSED".equals(r.getStatus()))
                .map(TeamRoleRequirement::getRoleName)
                .filter(x -> x != null && !x.isBlank())
                .toList();

        List<String> requiredTech = technologies.stream()
                .filter(TeamTechnology::isRequired)
                .map(TeamTechnology::getName)
                .filter(x -> x != null && !x.isBlank())
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

        double roleScore = computeRoleScore(user.getSelectedRole(), openRoles);
        double skillScore = computeSkillScore(requiredTech, matchedSkills);
        double experienceScore = computeExperienceScore(team.getExperienceLevel(), user.getExperiences());
        double availabilityScore = computeAvailabilityScore(user.getAvailabilityStatus());

        double total = round2(roleScore + skillScore + experienceScore + availabilityScore);

        String summary = buildSummary(user, openRoles, matchedSkills, missingSkills, team.getExperienceLevel());

        return new MatchScoreView(
                user.getId(),
                user.getUsername(),
                fullName(user),
                user.getSelectedRole(),
                total,
                matchedSkills,
                missingSkills,
                summary
        );
    }

    private double computeRoleScore(String selectedRole, List<String> openRoles) {
        if (openRoles.isEmpty()) {
            return selectedRole == null || selectedRole.isBlank() ? 10.0 : 20.0;
        }

        if (selectedRole == null || selectedRole.isBlank()) return 0.0;

        boolean directMatch = openRoles.stream().anyMatch(role -> equalsIgnoreCase(role, selectedRole));
        return directMatch ? 35.0 : 5.0;
    }

    private double computeSkillScore(List<String> requiredTech, List<String> matchedSkills) {
        if (requiredTech.isEmpty()) return 30.0;

        double ratio = (double) matchedSkills.size() / (double) requiredTech.size();
        return round2(ratio * 40.0);
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
            return 12.0;
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

    private String buildSummary(
            User user,
            List<String> openRoles,
            List<String> matchedSkills,
            List<String> missingSkills,
            String expectedLevel
    ) {
        List<String> parts = new ArrayList<>();

        if (user.getSelectedRole() != null && !user.getSelectedRole().isBlank()) {
            if (openRoles.stream().anyMatch(r -> equalsIgnoreCase(r, user.getSelectedRole()))) {
                parts.add("rola użytkownika pasuje do jednej z aktywnie poszukiwanych ról");
            } else {
                parts.add("rola użytkownika nie pokrywa się bezpośrednio z aktualnie poszukiwanymi rolami");
            }
        } else {
            parts.add("użytkownik nie ma jeszcze wybranej roli w profilu");
        }

        if (!matchedSkills.isEmpty()) {
            parts.add("pokrycie technologii: " + String.join(", ", matchedSkills));
        }

        if (!missingSkills.isEmpty()) {
            parts.add("braki technologiczne: " + String.join(", ", missingSkills));
        }

        parts.add("oczekiwany poziom doświadczenia zespołu: " + (expectedLevel == null ? "MIXED" : expectedLevel));

        return String.join("; ", parts);
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