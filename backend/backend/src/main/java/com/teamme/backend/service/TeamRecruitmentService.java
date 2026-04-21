package com.teamme.backend.service;

import com.teamme.backend.entity.Team;
import com.teamme.backend.entity.TeamMember;
import com.teamme.backend.entity.TeamMemberId;
import com.teamme.backend.entity.TeamRecruitmentRequest;
import com.teamme.backend.entity.TeamRoleRequirement;
import com.teamme.backend.entity.User;
import com.teamme.backend.repository.TeamMemberRepository;
import com.teamme.backend.repository.TeamRecruitmentRequestRepository;
import com.teamme.backend.repository.TeamRepository;
import com.teamme.backend.repository.TeamRoleRequirementRepository;
import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class TeamRecruitmentService {

    public record ApplyRequest(
            String targetRoleName,
            String message
    ) {}

    public record InviteRequest(
            String username,
            String targetRoleName,
            String message
    ) {}

    public record RespondRequest(
            String decision
    ) {}

    public record RecruitmentRequestView(
            Long id,
            Long teamId,
            String teamName,
            Long userId,
            String username,
            String fullName,
            String requestType,
            String status,
            String targetRoleName,
            String message,
            String createdByUsername,
            String respondedByUsername,
            String createdAt,
            String respondedAt
    ) {}

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRecruitmentRequestRepository teamRecruitmentRequestRepository;
    private final TeamRoleRequirementRepository teamRoleRequirementRepository;

    public TeamRecruitmentService(
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TeamRecruitmentRequestRepository teamRecruitmentRequestRepository,
            TeamRoleRequirementRepository teamRoleRequirementRepository
    ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRecruitmentRequestRepository = teamRecruitmentRequestRepository;
        this.teamRoleRequirementRepository = teamRoleRequirementRepository;
    }

    public RecruitmentRequestView applyToTeam(Long teamId, ApplyRequest req, String username) {
        User applicant = loadUser(username);
        Team team = loadTeam(teamId);

        ensureRecruitmentOpen(team);
        ensureNotOwner(team, applicant);
        ensureNotAlreadyMember(teamId, applicant.getId());
        ensureNoPendingRequest(teamId, applicant.getId());

        String targetRoleName = normalize(req.targetRoleName(), 80);
        validateTargetRoleIfProvided(teamId, targetRoleName);

        TeamRecruitmentRequest request = new TeamRecruitmentRequest();
        request.setTeam(team);
        request.setUser(applicant);
        request.setRequestType("APPLICATION");
        request.setStatus("PENDING");
        request.setTargetRoleName(targetRoleName);
        request.setMessage(normalize(req.message(), 4000));
        request.setCreatedByUser(applicant);

        TeamRecruitmentRequest saved = teamRecruitmentRequestRepository.save(request);
        return toView(saved);
    }

    public RecruitmentRequestView inviteToTeam(Long teamId, InviteRequest req, String ownerUsername) {
        User owner = loadUser(ownerUsername);
        Team team = getOwnedTeam(teamId, ownerUsername);
        User targetUser = loadUserByUsernameField(req.username());

        ensureRecruitmentOpen(team);
        if (owner.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("Nie możesz zaprosić samego siebie do własnego zespołu.");
        }

        ensureNotAlreadyMember(teamId, targetUser.getId());
        ensureNoPendingRequest(teamId, targetUser.getId());

        String targetRoleName = normalize(req.targetRoleName(), 80);
        validateTargetRoleIfProvided(teamId, targetRoleName);

        TeamRecruitmentRequest request = new TeamRecruitmentRequest();
        request.setTeam(team);
        request.setUser(targetUser);
        request.setRequestType("INVITATION");
        request.setStatus("PENDING");
        request.setTargetRoleName(targetRoleName);
        request.setMessage(normalize(req.message(), 4000));
        request.setCreatedByUser(owner);

        TeamRecruitmentRequest saved = teamRecruitmentRequestRepository.save(request);
        return toView(saved);
    }

    @Transactional(readOnly = true)
    public List<RecruitmentRequestView> listTeamRequests(Long teamId, String username) {
        getOwnedTeam(teamId, username);

        return teamRecruitmentRequestRepository.findByTeam_IdOrderByCreatedAtDesc(teamId).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecruitmentRequestView> listMyRequests(String username) {
        return teamRecruitmentRequestRepository.findByUser_UsernameOrderByCreatedAtDesc(username).stream()
                .map(this::toView)
                .toList();
    }

    public RecruitmentRequestView respondToRequest(Long requestId, RespondRequest req, String username) {
        TeamRecruitmentRequest request = teamRecruitmentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zgłoszenia rekrutacyjnego."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("To zgłoszenie nie oczekuje już na decyzję.");
        }

        String decision = normalizeEnum(req.decision(), 20);
        if (decision == null || (!decision.equals("ACCEPTED") && !decision.equals("REJECTED") && !decision.equals("CANCELLED"))) {
            throw new IllegalArgumentException("Dozwolone decyzje to: ACCEPTED, REJECTED lub CANCELLED.");
        }

        User actor = loadUser(username);

        if ("APPLICATION".equals(request.getRequestType())) {
            if ("CANCELLED".equals(decision)) {
                if (!actor.getId().equals(request.getUser().getId())) {
                    throw new IllegalArgumentException("Tylko autor aplikacji może ją anulować.");
                }
            } else {
                ensureOwner(request.getTeam(), actor);
            }
        } else if ("INVITATION".equals(request.getRequestType())) {
            if ("CANCELLED".equals(decision)) {
                if (!actor.getId().equals(request.getCreatedByUser().getId())) {
                    throw new IllegalArgumentException("Tylko autor zaproszenia może je anulować.");
                }
            } else {
                if (!actor.getId().equals(request.getUser().getId())) {
                    throw new IllegalArgumentException("Tylko zaproszony użytkownik może odpowiedzieć na to zaproszenie.");
                }
            }
        } else {
            throw new IllegalArgumentException("Nieobsługiwany typ zgłoszenia rekrutacyjnego.");
        }

        if ("ACCEPTED".equals(decision)) {
            acceptRequest(request, actor);
        } else {
            request.setStatus(decision);
            request.setRespondedByUser(actor);
            request.setRespondedAt(OffsetDateTime.now());
            teamRecruitmentRequestRepository.save(request);
        }

        return toView(request);
    }

    private void acceptRequest(TeamRecruitmentRequest request, User actor) {
        Team team = request.getTeam();
        User user = request.getUser();

        ensureRecruitmentOpen(team);
        ensureNotAlreadyMember(team.getId(), user.getId());

        long currentMembers = teamMemberRepository.countByTeam_Id(team.getId());
        if (currentMembers >= team.getMaxMembers()) {
            team.setRecruitmentStatus("FULL");
            teamRepository.save(team);
            throw new IllegalArgumentException("Zespół osiągnął już maksymalną liczbę członków.");
        }

        TeamMember membership = new TeamMember();
        membership.setId(new TeamMemberId(team.getId(), user.getId()));
        membership.setTeam(team);
        membership.setUser(user);
        membership.setRoleLabel(
                request.getTargetRoleName() == null || request.getTargetRoleName().isBlank()
                        ? "Member"
                        : request.getTargetRoleName()
        );

        teamMemberRepository.save(membership);

        request.setStatus("ACCEPTED");
        request.setRespondedByUser(actor);
        request.setRespondedAt(OffsetDateTime.now());
        teamRecruitmentRequestRepository.save(request);

        syncRoleRequirementStatuses(team);
        syncRecruitmentStatus(team);
    }

    private void syncRoleRequirementStatuses(Team team) {
        List<TeamMember> members = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(team.getId());
        List<TeamRoleRequirement> roleRequirements =
                teamRoleRequirementRepository.findByTeam_IdOrderByPriorityDescProjectRoleNameAsc(team.getId());

        for (TeamRoleRequirement requirement : roleRequirements) {
            long assigned = members.stream()
                    .filter(m -> equalsIgnoreCase(m.getRoleLabel(), requirement.getProjectRoleName()))
                    .count();

            if (assigned >= requirement.getSlots()) {
                requirement.setStatus("FILLED");
            } else {
                requirement.setStatus("OPEN");
            }
        }

        teamRoleRequirementRepository.saveAll(roleRequirements);
    }

    private void syncRecruitmentStatus(Team team) {
        long memberCount = teamMemberRepository.countByTeam_Id(team.getId());
        if (memberCount >= team.getMaxMembers()) {
            team.setRecruitmentStatus("FULL");
        } else if ("FULL".equals(team.getRecruitmentStatus())) {
            team.setRecruitmentStatus("OPEN");
        }
        teamRepository.save(team);
    }

    private Team getOwnedTeam(Long teamId, String username) {
        Team team = loadTeam(teamId);
        User user = loadUser(username);
        ensureOwner(team, user);
        return team;
    }

    private void ensureOwner(Team team, User user) {
        if (team.getOwnerUser() == null || !team.getOwnerUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Tylko właściciel zespołu może wykonać tę operację.");
        }
    }

    private void ensureRecruitmentOpen(Team team) {
        if (!"OPEN".equals(team.getRecruitmentStatus())) {
            throw new IllegalArgumentException("Rekrutacja do tego zespołu nie jest obecnie otwarta.");
        }
    }

    private void ensureNotOwner(Team team, User user) {
        if (team.getOwnerUser() != null && team.getOwnerUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Właściciel zespołu nie może aplikować do własnego zespołu.");
        }
    }

    private void ensureNotAlreadyMember(Long teamId, Long userId) {
        if (teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new IllegalArgumentException("Ten użytkownik należy już do zespołu.");
        }
    }

    private void ensureNoPendingRequest(Long teamId, Long userId) {
        if (teamRecruitmentRequestRepository.findByTeam_IdAndUser_IdAndStatus(teamId, userId, "PENDING").isPresent()) {
            throw new IllegalArgumentException("Istnieje już oczekujące zgłoszenie rekrutacyjne dla tego użytkownika i zespołu.");
        }
    }

    private void validateTargetRoleIfProvided(Long teamId, String targetRoleName) {
        if (targetRoleName == null) return;

        boolean exists = teamRoleRequirementRepository.findByTeam_IdOrderByPriorityDescProjectRoleNameAsc(teamId).stream()
                .anyMatch(r -> equalsIgnoreCase(r.getProjectRoleName(), targetRoleName));

        if (!exists) {
            throw new IllegalArgumentException("Wybrana rola nie znajduje się na liście ról poszukiwanych przez zespół.");
        }
    }

    private RecruitmentRequestView toView(TeamRecruitmentRequest request) {
        return new RecruitmentRequestView(
                request.getId(),
                request.getTeam().getId(),
                request.getTeam().getName(),
                request.getUser().getId(),
                request.getUser().getUsername(),
                fullName(request.getUser()),
                request.getRequestType(),
                request.getStatus(),
                request.getTargetRoleName(),
                request.getMessage(),
                request.getCreatedByUser() == null ? null : request.getCreatedByUser().getUsername(),
                request.getRespondedByUser() == null ? null : request.getRespondedByUser().getUsername(),
                request.getCreatedAt() == null ? null : request.getCreatedAt().toString(),
                request.getRespondedAt() == null ? null : request.getRespondedAt().toString()
        );
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));
    }

    private User loadUserByUsernameField(String username) {
        String normalized = normalize(username, 80);
        if (normalized == null) {
            throw new IllegalArgumentException("Nazwa użytkownika zapraszanej osoby jest wymagana.");
        }
        return loadUser(normalized);
    }

    private Team loadTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zespołu."));
    }

    private String fullName(User user) {
        String value = Stream.of(user.getFirstName(), user.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "))
                .trim();

        return value.isBlank() ? user.getUsername() : value;
    }

    private String normalize(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;
    }

    private String normalizeEnum(String value, int maxLen) {
        String normalized = normalize(value, maxLen);
        if (normalized == null) return null;
        return normalized.toUpperCase(Locale.ROOT)
                .replace(' ', '_')
                .replace('-', '_');
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) return false;
        return left.trim().equalsIgnoreCase(right.trim());
    }
}