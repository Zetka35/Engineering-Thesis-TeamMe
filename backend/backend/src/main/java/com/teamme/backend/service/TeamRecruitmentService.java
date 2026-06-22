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
import com.teamme.backend.notification.NotificationEvent;
import com.teamme.backend.notification.NotificationWebSocketService;
import java.util.Comparator;

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
            String teamRoleLabel,
            String message,
            Boolean showOnPublicProfile
    ) {}

    public record InviteRequest(
            String username,
            String targetRoleName,
            String message
    ) {}

    public record RespondRequest(
            String decision,
            Boolean showOnPublicProfile,
            String teamRoleLabel
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
            String teamRoleLabel,
            String message,
            Boolean showOnPublicProfile,
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
    private final NotificationWebSocketService notificationWebSocketService;

    public TeamRecruitmentService(
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TeamRecruitmentRequestRepository teamRecruitmentRequestRepository,
            TeamRoleRequirementRepository teamRoleRequirementRepository,
            NotificationWebSocketService notificationWebSocketService
    ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRecruitmentRequestRepository = teamRecruitmentRequestRepository;
        this.teamRoleRequirementRepository = teamRoleRequirementRepository;
        this.notificationWebSocketService = notificationWebSocketService;
    }

    private static final List<String> TEAM_ROLE_NAMES = List.of(
            "Inicjator Pomysłów",
            "Koordynator Relacji",
            "Realizator Zadań",
            "Kontroler Jakości",
            "Analityk Strategiczny",
            "Filar Wsparcia",
            "Łowca Informacji"
    );

    private String normalizeTeamRoleOrFallback(String value, String fallback) {
        String normalizedValue = normalize(value, 80);
        String normalizedFallback = normalize(fallback, 80);

        String roleToCheck = normalizedValue != null ? normalizedValue : normalizedFallback;

        if (roleToCheck == null) {
            return null;
        }

        return TEAM_ROLE_NAMES.stream()
                .filter(role -> role.equalsIgnoreCase(roleToCheck))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Nieprawidłowa rola zespołowa. Dozwolone wartości: "
                                + String.join(", ", TEAM_ROLE_NAMES)
                ));
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
        String teamRoleLabel = normalizeTeamRoleOrFallback(req.teamRoleLabel(), applicant.getSelectedRole());

        TeamRecruitmentRequest request = new TeamRecruitmentRequest();
        request.setTeam(team);
        request.setUser(applicant);
        request.setRequestType("APPLICATION");
        request.setStatus("PENDING");
        request.setTargetRoleName(targetRoleName);
        request.setTeamRoleLabel(teamRoleLabel);
        request.setMessage(normalize(req.message(), 4000));
        request.setShowOnPublicProfile(req.showOnPublicProfile() == null || req.showOnPublicProfile());
        request.setCreatedByUser(applicant);

        TeamRecruitmentRequest saved = teamRecruitmentRequestRepository.save(request);

        if (team.getOwnerUser() != null) {
            notificationWebSocketService.sendToUser(
                    team.getOwnerUser().getUsername(),
                    new NotificationEvent(
                            "RECRUITMENT_REQUEST_CREATED",
                            "Nowa aplikacja do zespołu",
                            applicant.getUsername() + " wysłał/a aplikację do zespołu " + team.getName() + ".",
                            team.getId(),
                            team.getName(),
                            saved.getId(),
                            saved.getRequestType(),
                            saved.getStatus()
                    )
            );
        }

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
        String teamRoleLabel = normalizeTeamRoleOrFallback(null, targetUser.getSelectedRole());

        TeamRecruitmentRequest request = new TeamRecruitmentRequest();
        request.setTeam(team);
        request.setUser(targetUser);
        request.setRequestType("INVITATION");
        request.setStatus("PENDING");
        request.setTargetRoleName(targetRoleName);
        request.setTeamRoleLabel(teamRoleLabel);
        request.setMessage(normalize(req.message(), 4000));
        request.setShowOnPublicProfile(true);
        request.setCreatedByUser(owner);

        TeamRecruitmentRequest saved = teamRecruitmentRequestRepository.save(request);

        notificationWebSocketService.sendToUser(
                targetUser.getUsername(),
                new NotificationEvent(
                        "RECRUITMENT_REQUEST_CREATED",
                        "Nowe zaproszenie do zespołu",
                        "Otrzymano zaproszenie do zespołu " + team.getName() + ".",
                        team.getId(),
                        team.getName(),
                        saved.getId(),
                        saved.getRequestType(),
                        saved.getStatus()
                )
        );

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
        List<TeamRecruitmentRequest> directlyRelatedRequests =
                teamRecruitmentRequestRepository
                        .findByUser_UsernameOrCreatedByUser_UsernameOrderByCreatedAtDesc(username, username);

        List<TeamRecruitmentRequest> ownedTeamRequests =
                teamRecruitmentRequestRepository
                        .findByTeam_OwnerUser_UsernameOrderByCreatedAtDesc(username);

        var uniqueById = Stream.concat(directlyRelatedRequests.stream(), ownedTeamRequests.stream())
                .collect(Collectors.toMap(
                        TeamRecruitmentRequest::getId,
                        request -> request,
                        (first, second) -> first
                ));

        return uniqueById.values().stream()
                .sorted(Comparator.comparing(
                        TeamRecruitmentRequest::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
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
            acceptRequest(request, actor, req.showOnPublicProfile(), req.teamRoleLabel());
        } else {
            request.setStatus(decision);
            request.setRespondedByUser(actor);
            request.setRespondedAt(OffsetDateTime.now());
            teamRecruitmentRequestRepository.save(request);
        }

        notifyAboutRequestDecision(request, actor);
        return toView(request);
    }

    private void notifyAboutRequestDecision(TeamRecruitmentRequest request, User actor) {
        if (request.getTeam() == null || request.getUser() == null) {
            return;
        }

        String recipientUsername = null;

        if ("APPLICATION".equals(request.getRequestType())) {
            recipientUsername = request.getUser().getUsername();
        } else if ("INVITATION".equals(request.getRequestType())) {
            if (request.getCreatedByUser() != null) {
                recipientUsername = request.getCreatedByUser().getUsername();
            }
        }

        if (recipientUsername == null || recipientUsername.equals(actor.getUsername())) {
            return;
        }

        String title = switch (request.getStatus()) {
            case "ACCEPTED" -> "Zgłoszenie zaakceptowane";
            case "REJECTED" -> "Zgłoszenie odrzucone";
            case "CANCELLED" -> "Zgłoszenie anulowane";
            default -> "Aktualizacja zgłoszenia";
        };

        String message = "Status zgłoszenia w zespole "
                + request.getTeam().getName()
                + " zmienił się na "
                + request.getStatus()
                + ".";

        notificationWebSocketService.sendToUser(
                recipientUsername,
                new NotificationEvent(
                        "RECRUITMENT_REQUEST_UPDATED",
                        title,
                        message,
                        request.getTeam().getId(),
                        request.getTeam().getName(),
                        request.getId(),
                        request.getRequestType(),
                        request.getStatus()
                )
        );
    }

    private void acceptRequest(
            TeamRecruitmentRequest request,
            User actor,
            Boolean showOnPublicProfileFromResponse,
            String teamRoleLabelFromResponse
    ) {
        Team team = request.getTeam();
        User user = request.getUser();

        ensureRecruitmentOpen(team);
        ensureNotAlreadyMember(team.getId(), user.getId());

        long currentMembers = countActiveMembers(team.getId());
        if (currentMembers >= team.getMaxMembers()) {
            team.setRecruitmentStatus("FULL");
            teamRepository.save(team);
            throw new IllegalArgumentException("Zespół osiągnął już maksymalną liczbę członków.");
        }

        TeamMember membership = teamMemberRepository
                .findByTeam_IdAndUser_Id(team.getId(), user.getId())
                .orElseGet(() -> {
                    TeamMember created = new TeamMember();
                    created.setId(new TeamMemberId(team.getId(), user.getId()));
                    created.setTeam(team);
                    created.setUser(user);
                    return created;
                });

        membership.setLeftAt(null);
        membership.setRoleLabel(
                request.getTargetRoleName() == null || request.getTargetRoleName().isBlank()
                        ? "Członek zespołu"
                        : request.getTargetRoleName()
        );
        String teamRoleLabel;

        if ("INVITATION".equals(request.getRequestType())) {
            teamRoleLabel = normalizeTeamRoleOrFallback(teamRoleLabelFromResponse, user.getSelectedRole());
        } else {
            teamRoleLabel = normalizeTeamRoleOrFallback(request.getTeamRoleLabel(), user.getSelectedRole());
        }

        membership.setTeamRoleLabel(teamRoleLabel);

        boolean showOnPublicProfile;

        if ("APPLICATION".equals(request.getRequestType())) {
            showOnPublicProfile = request.isShowOnPublicProfile();
        } else if ("INVITATION".equals(request.getRequestType())) {
            showOnPublicProfile = showOnPublicProfileFromResponse == null || showOnPublicProfileFromResponse;
        } else {
            showOnPublicProfile = true;
        }

        membership.setShowOnPublicProfile(showOnPublicProfile);

        teamMemberRepository.save(membership);

        request.setStatus("ACCEPTED");
        request.setRespondedByUser(actor);
        request.setRespondedAt(OffsetDateTime.now());
        teamRecruitmentRequestRepository.save(request);

        syncRoleRequirementStatuses(team);
        syncRecruitmentStatus(team);
    }

    private void syncRoleRequirementStatuses(Team team) {
        List<TeamMember> members = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(team.getId()).stream()
                .filter(this::isActiveMembership)
                .toList();
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
        long memberCount = countActiveMembers(team.getId());
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
        boolean activeMember = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .filter(this::isActiveMembership)
                .isPresent();

        if (activeMember) {
            throw new IllegalArgumentException("Ten użytkownik należy już do zespołu.");
        }
    }

    private long countActiveMembers(Long teamId) {
        return teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(teamId).stream()
                .filter(this::isActiveMembership)
                .count();
    }

    private boolean isActiveMembership(TeamMember membership) {
        return membership != null && membership.getLeftAt() == null;
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
                request.getTeamRoleLabel(),
                request.getMessage(),
                request.isShowOnPublicProfile(),
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