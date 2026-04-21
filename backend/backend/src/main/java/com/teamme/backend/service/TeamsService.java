package com.teamme.backend.service;

import com.teamme.backend.entity.*;
import com.teamme.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class TeamsService {

  public record TeamSummary(
          Long id,
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers,
          long memberCount,
          String myRole,
          String nextMeetingAt,
          String projectArea,
          String experienceLevel,
          String recruitmentStatus
  ) {}

  public record MemberView(
          Long userId,
          String username,
          String fullName,
          String roleLabel
  ) {}

  public record MeetingView(
          Long id,
          String title,
          String description,
          String startsAt,
          String endsAt,
          String location
  ) {}

  public record TaskView(
          Long id,
          String title,
          String description,
          String status,
          String dueAt,
          Long assigneeUserId,
          String assigneeUsername
  ) {}

  public record TechnologyView(
          Long id,
          String name,
          Integer requiredLevel,
          boolean required
  ) {}

  public record RoleRequirementView(
          Long id,
          String roleName,
          Integer slots,
          String description,
          Integer priority,
          String status
  ) {}

  public record RecruitmentRequestView(
          Long id,
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

  public record TeamDetails(
          Long id,
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers,
          String status,
          String recruitmentStatus,
          String projectArea,
          String experienceLevel,
          String ownerUsername,
          String myRole,
          List<MemberView> members,
          List<TechnologyView> technologies,
          List<RoleRequirementView> roleRequirements,
          List<RecruitmentRequestView> recruitmentRequests,
          List<MeetingView> meetings,
          List<TaskView> tasks
  ) {}

  public record TeamPublicDetails(
          Long id,
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers,
          long memberCount,
          String status,
          String recruitmentStatus,
          String projectArea,
          String experienceLevel,
          String ownerUsername,
          List<TechnologyView> technologies,
          List<RoleRequirementView> roleRequirements
  ) {}

  public record TechnologyInput(
          String name,
          Integer requiredLevel,
          Boolean required
  ) {}

  public record RoleRequirementInput(
          String roleName,
          Integer slots,
          String description,
          Integer priority
  ) {}

  public record TeamUpsert(
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers,
          String projectArea,
          String experienceLevel,
          String recruitmentStatus,
          List<TechnologyInput> technologies,
          List<RoleRequirementInput> roleRequirements
  ) {}

  public record MeetingCreate(
          String title,
          String description,
          String startsAt,
          String endsAt,
          String location
  ) {}

  public record TaskCreate(
          String title,
          String description,
          String dueAt,
          Long assigneeUserId
  ) {}

  private final UserRepository userRepository;
  private final TeamRepository teamRepository;
  private final TeamMemberRepository teamMemberRepository;
  private final TeamMeetingRepository teamMeetingRepository;
  private final TeamTaskRepository teamTaskRepository;
  private final TeamTechnologyRepository teamTechnologyRepository;
  private final TeamRoleRequirementRepository teamRoleRequirementRepository;
  private final TeamRecruitmentRequestRepository teamRecruitmentRequestRepository;

  public TeamsService(
          UserRepository userRepository,
          TeamRepository teamRepository,
          TeamMemberRepository teamMemberRepository,
          TeamMeetingRepository teamMeetingRepository,
          TeamTaskRepository teamTaskRepository,
          TeamTechnologyRepository teamTechnologyRepository,
          TeamRoleRequirementRepository teamRoleRequirementRepository,
          TeamRecruitmentRequestRepository teamRecruitmentRequestRepository
  ) {
    this.userRepository = userRepository;
    this.teamRepository = teamRepository;
    this.teamMemberRepository = teamMemberRepository;
    this.teamMeetingRepository = teamMeetingRepository;
    this.teamTaskRepository = teamTaskRepository;
    this.teamTechnologyRepository = teamTechnologyRepository;
    this.teamRoleRequirementRepository = teamRoleRequirementRepository;
    this.teamRecruitmentRequestRepository = teamRecruitmentRequestRepository;
  }

  @Transactional(readOnly = true)
  public List<TeamSummary> getTeamsForUser(String username) {
    userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));

    return teamRepository.findAllForUsername(username).stream()
            .map(team -> {
              long memberCount = teamMemberRepository.countByTeam_Id(team.getId());

              String myRole = teamMemberRepository.findByTeam_IdAndUser_Username(team.getId(), username)
                      .map(TeamMember::getRoleLabel)
                      .orElse("Member");

              List<TeamMeeting> meetings = teamMeetingRepository.findByTeam_IdOrderByStartsAtAsc(team.getId());

              String nextMeetingAt = meetings.stream()
                      .filter(m -> !m.getStartsAt().isBefore(OffsetDateTime.now()))
                      .min(Comparator.comparing(TeamMeeting::getStartsAt))
                      .or(() -> meetings.stream().findFirst())
                      .map(m -> m.getStartsAt().toString())
                      .orElse(null);

              return new TeamSummary(
                      team.getId(),
                      team.getName(),
                      team.getDescription(),
                      team.getExpectedTimeText(),
                      team.getMaxMembers(),
                      memberCount,
                      myRole,
                      nextMeetingAt,
                      team.getProjectArea(),
                      team.getExperienceLevel(),
                      team.getRecruitmentStatus()
              );
            })
            .toList();
  }

  @Transactional(readOnly = true)
  public List<TeamSummary> searchOpenTeams(String username) {
    userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));

    return teamRepository.findAllOpenRecruitment().stream()
            .map(team -> {
              long memberCount = teamMemberRepository.countByTeam_Id(team.getId());

              String myRole = teamMemberRepository.findByTeam_IdAndUser_Username(team.getId(), username)
                      .map(TeamMember::getRoleLabel)
                      .orElse(null);

              List<TeamMeeting> meetings = teamMeetingRepository.findByTeam_IdOrderByStartsAtAsc(team.getId());

              String nextMeetingAt = meetings.stream()
                      .filter(m -> !m.getStartsAt().isBefore(OffsetDateTime.now()))
                      .min(Comparator.comparing(TeamMeeting::getStartsAt))
                      .or(() -> meetings.stream().findFirst())
                      .map(m -> m.getStartsAt().toString())
                      .orElse(null);

              return new TeamSummary(
                      team.getId(),
                      team.getName(),
                      team.getDescription(),
                      team.getExpectedTimeText(),
                      team.getMaxMembers(),
                      memberCount,
                      myRole,
                      nextMeetingAt,
                      team.getProjectArea(),
                      team.getExperienceLevel(),
                      team.getRecruitmentStatus()
              );
            })
            .toList();
  }

  @Transactional(readOnly = true)
  public TeamDetails getTeam(Long teamId, String username) {
    Team team = getAccessibleTeam(teamId, username);
    return toPrivateDetails(team, username);
  }

  @Transactional(readOnly = true)
  public TeamPublicDetails getPublicTeam(Long teamId) {
    Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zespołu."));
    return toPublicDetails(team);
  }

  public TeamDetails createTeam(TeamUpsert req, String username) {
    User owner = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));

    String name = normalize(req.name(), 200);
    if (name == null) {
      throw new IllegalArgumentException("Nazwa zespołu jest wymagana.");
    }

    Integer maxMembers = req.maxMembers() == null ? 4 : req.maxMembers();
    if (maxMembers < 1) {
      throw new IllegalArgumentException("Liczba członków musi być większa od 0.");
    }

    Team team = new Team();
    team.setName(name);
    team.setDescription(normalize(req.description(), 4000));
    team.setExpectedTimeText(normalize(req.expectedTimeText(), 120));
    team.setMaxMembers(maxMembers);
    team.setStatus("ACTIVE");
    team.setProjectArea(normalize(req.projectArea(), 120));
    team.setExperienceLevel(normalizeTeamExperienceLevel(req.experienceLevel()));
    team.setRecruitmentStatus(normalizeRecruitmentStatus(req.recruitmentStatus()));
    team.setOwnerUser(owner);

    Team saved = teamRepository.save(team);

    TeamMember ownerMembership = new TeamMember();
    ownerMembership.setId(new TeamMemberId(saved.getId(), owner.getId()));
    ownerMembership.setTeam(saved);
    ownerMembership.setUser(owner);
    ownerMembership.setRoleLabel("Owner");
    teamMemberRepository.save(ownerMembership);

    replaceTechnologies(saved, req.technologies());
    replaceRoleRequirements(saved, req.roleRequirements());

    return toPrivateDetails(saved, username);
  }

  public TeamDetails updateTeam(Long teamId, TeamUpsert req, String username) {
    Team team = getOwnedTeam(teamId, username);

    String name = normalize(req.name(), 200);
    if (name == null) {
      throw new IllegalArgumentException("Nazwa zespołu jest wymagana.");
    }

    Integer maxMembers = req.maxMembers() == null ? team.getMaxMembers() : req.maxMembers();
    if (maxMembers < 1) {
      throw new IllegalArgumentException("Liczba członków musi być większa od 0.");
    }

    if (teamMemberRepository.countByTeam_Id(teamId) > maxMembers) {
      throw new IllegalArgumentException("Nie można ustawić limitu mniejszego niż aktualna liczba członków.");
    }

    team.setName(name);
    team.setDescription(normalize(req.description(), 4000));
    team.setExpectedTimeText(normalize(req.expectedTimeText(), 120));
    team.setMaxMembers(maxMembers);
    team.setProjectArea(normalize(req.projectArea(), 120));
    team.setExperienceLevel(normalizeTeamExperienceLevel(req.experienceLevel()));
    team.setRecruitmentStatus(normalizeRecruitmentStatus(req.recruitmentStatus()));

    Team saved = teamRepository.save(team);

    replaceTechnologies(saved, req.technologies());
    replaceRoleRequirements(saved, req.roleRequirements());

    return toPrivateDetails(saved, username);
  }

  public TeamDetails addMeeting(Long teamId, MeetingCreate req, String username) {
    Team team = getAccessibleTeam(teamId, username);
    User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));

    String title = normalize(req.title(), 200);
    if (title == null) {
      throw new IllegalArgumentException("Tytuł spotkania jest wymagany.");
    }
    if (req.startsAt() == null || req.startsAt().isBlank()) {
      throw new IllegalArgumentException("Data rozpoczęcia spotkania jest wymagana.");
    }

    OffsetDateTime startsAt = parseOffsetDateTime(req.startsAt(), "Nieprawidłowa data rozpoczęcia spotkania.");
    OffsetDateTime endsAt = req.endsAt() == null || req.endsAt().isBlank()
            ? null
            : parseOffsetDateTime(req.endsAt(), "Nieprawidłowa data zakończenia spotkania.");

    if (endsAt != null && endsAt.isBefore(startsAt)) {
      throw new IllegalArgumentException("Data zakończenia spotkania nie może być wcześniejsza niż data rozpoczęcia.");
    }

    TeamMeeting meeting = new TeamMeeting();
    meeting.setTeam(team);
    meeting.setTitle(title);
    meeting.setDescription(normalize(req.description(), 4000));
    meeting.setStartsAt(startsAt);
    meeting.setEndsAt(endsAt);
    meeting.setLocation(normalize(req.location(), 200));
    meeting.setCreatedByUser(author);

    teamMeetingRepository.save(meeting);
    return toPrivateDetails(team, username);
  }

  public TeamDetails addTask(Long teamId, TaskCreate req, String username) {
    Team team = getAccessibleTeam(teamId, username);
    User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));

    String title = normalize(req.title(), 200);
    if (title == null) {
      throw new IllegalArgumentException("Tytuł zadania jest wymagany.");
    }

    User assignee = null;
    if (req.assigneeUserId() != null) {
      if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, req.assigneeUserId())) {
        throw new IllegalArgumentException("Wybrany użytkownik nie należy do tego zespołu.");
      }
      assignee = userRepository.findById(req.assigneeUserId())
              .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono przypisanego użytkownika."));
    }

    TeamTask task = new TeamTask();
    task.setTeam(team);
    task.setTitle(title);
    task.setDescription(normalize(req.description(), 4000));
    task.setStatus("TODO");
    task.setDueAt(req.dueAt() == null || req.dueAt().isBlank()
            ? null
            : parseOffsetDateTime(req.dueAt(), "Nieprawidłowy termin zadania."));
    task.setAssigneeUser(assignee);
    task.setCreatedByUser(author);

    teamTaskRepository.save(task);
    return toPrivateDetails(team, username);
  }

  private Team getAccessibleTeam(Long teamId, String username) {
    Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zespołu."));
    if (!teamMemberRepository.existsByTeam_IdAndUser_Username(teamId, username)) {
      throw new IllegalArgumentException("Nie masz dostępu do tego zespołu.");
    }
    return team;
  }

  private Team getOwnedTeam(Long teamId, String username) {
    Team team = getAccessibleTeam(teamId, username);
    if (team.getOwnerUser() == null || !username.equals(team.getOwnerUser().getUsername())) {
      throw new IllegalArgumentException("Tylko właściciel zespołu może edytować profil zespołu.");
    }
    return team;
  }

  private TeamDetails toPrivateDetails(Team team, String username) {
    boolean isOwner = team.getOwnerUser() != null && username.equals(team.getOwnerUser().getUsername());

    List<MemberView> members = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(team.getId()).stream()
            .map(tm -> new MemberView(
                    tm.getUser().getId(),
                    tm.getUser().getUsername(),
                    fullName(tm.getUser()),
                    tm.getRoleLabel()
            ))
            .toList();

    List<TechnologyView> technologies = loadTechnologies(team.getId());
    List<RoleRequirementView> roleRequirements = loadRoleRequirements(team.getId());

    List<RecruitmentRequestView> recruitmentRequests = teamRecruitmentRequestRepository
            .findByTeam_IdOrderByCreatedAtDesc(team.getId()).stream()
            .filter(r ->
                    isOwner ||
                            username.equals(r.getUser().getUsername()) ||
                            (r.getCreatedByUser() != null && username.equals(r.getCreatedByUser().getUsername()))
            )
            .map(r -> new RecruitmentRequestView(
                    r.getId(),
                    r.getUser().getId(),
                    r.getUser().getUsername(),
                    fullName(r.getUser()),
                    r.getRequestType(),
                    r.getStatus(),
                    r.getTargetRoleName(),
                    r.getMessage(),
                    r.getCreatedByUser() == null ? null : r.getCreatedByUser().getUsername(),
                    r.getRespondedByUser() == null ? null : r.getRespondedByUser().getUsername(),
                    r.getCreatedAt() == null ? null : r.getCreatedAt().toString(),
                    r.getRespondedAt() == null ? null : r.getRespondedAt().toString()
            ))
            .toList();

    List<MeetingView> meetings = teamMeetingRepository.findByTeam_IdOrderByStartsAtAsc(team.getId()).stream()
            .map(m -> new MeetingView(
                    m.getId(),
                    m.getTitle(),
                    m.getDescription(),
                    m.getStartsAt().toString(),
                    m.getEndsAt() == null ? null : m.getEndsAt().toString(),
                    m.getLocation()
            ))
            .toList();

    List<TaskView> tasks = teamTaskRepository.findByTeam_IdOrderByCreatedAtDesc(team.getId()).stream()
            .map(t -> new TaskView(
                    t.getId(),
                    t.getTitle(),
                    t.getDescription(),
                    t.getStatus(),
                    t.getDueAt() == null ? null : t.getDueAt().toString(),
                    t.getAssigneeUser() == null ? null : t.getAssigneeUser().getId(),
                    t.getAssigneeUser() == null ? null : t.getAssigneeUser().getUsername()
            ))
            .toList();

    String myRole = teamMemberRepository.findByTeam_IdAndUser_Username(team.getId(), username)
            .map(TeamMember::getRoleLabel)
            .orElse("Member");

    return new TeamDetails(
            team.getId(),
            team.getName(),
            team.getDescription(),
            team.getExpectedTimeText(),
            team.getMaxMembers(),
            team.getStatus(),
            team.getRecruitmentStatus(),
            team.getProjectArea(),
            team.getExperienceLevel(),
            team.getOwnerUser() == null ? null : team.getOwnerUser().getUsername(),
            myRole,
            members,
            technologies,
            roleRequirements,
            recruitmentRequests,
            meetings,
            tasks
    );
  }

  private TeamPublicDetails toPublicDetails(Team team) {
    return new TeamPublicDetails(
            team.getId(),
            team.getName(),
            team.getDescription(),
            team.getExpectedTimeText(),
            team.getMaxMembers(),
            teamMemberRepository.countByTeam_Id(team.getId()),
            team.getStatus(),
            team.getRecruitmentStatus(),
            team.getProjectArea(),
            team.getExperienceLevel(),
            team.getOwnerUser() == null ? null : team.getOwnerUser().getUsername(),
            loadTechnologies(team.getId()),
            loadRoleRequirements(team.getId())
    );
  }

  private List<TechnologyView> loadTechnologies(Long teamId) {
    return teamTechnologyRepository.findByTeam_IdOrderByNameAsc(teamId).stream()
            .map(t -> new TechnologyView(
                    t.getId(),
                    t.getName(),
                    t.getRequiredLevel(),
                    t.isRequired()
            ))
            .toList();
  }

  private List<RoleRequirementView> loadRoleRequirements(Long teamId) {
    return teamRoleRequirementRepository.findByTeam_IdOrderByPriorityDescRoleNameAsc(teamId).stream()
            .map(r -> new RoleRequirementView(
                    r.getId(),
                    r.getRoleName(),
                    r.getSlots(),
                    r.getDescription(),
                    r.getPriority(),
                    r.getStatus()
            ))
            .toList();
  }

  private void replaceTechnologies(Team team, List<TechnologyInput> requests) {
    teamTechnologyRepository.deleteByTeam_Id(team.getId());
    if (requests == null) return;

    for (TechnologyInput req : requests) {
      if (req == null) continue;

      String name = normalize(req.name(), 80);
      if (name == null) continue;

      Integer level = req.requiredLevel();
      if (level != null && (level < 1 || level > 5)) {
        throw new IllegalArgumentException("Poziom wymaganej technologii musi być w zakresie 1-5.");
      }

      TeamTechnology entity = new TeamTechnology();
      entity.setTeam(team);
      entity.setName(name);
      entity.setRequiredLevel(level);
      entity.setRequired(req.required() == null || req.required());

      teamTechnologyRepository.save(entity);
    }
  }

  private void replaceRoleRequirements(Team team, List<RoleRequirementInput> requests) {
    teamRoleRequirementRepository.deleteByTeam_Id(team.getId());
    if (requests == null) return;

    for (RoleRequirementInput req : requests) {
      if (req == null) continue;

      String roleName = normalize(req.roleName(), 80);
      if (roleName == null) continue;

      Integer slots = req.slots() == null ? 1 : req.slots();
      if (slots < 1) {
        throw new IllegalArgumentException("Liczba miejsc dla roli musi być większa od 0.");
      }

      Integer priority = req.priority() == null ? 1 : req.priority();
      if (priority < 1 || priority > 5) {
        throw new IllegalArgumentException("Priorytet roli musi być w zakresie 1-5.");
      }

      TeamRoleRequirement entity = new TeamRoleRequirement();
      entity.setTeam(team);
      entity.setRoleName(roleName);
      entity.setSlots(slots);
      entity.setDescription(normalize(req.description(), 4000));
      entity.setPriority(priority);
      entity.setStatus("OPEN");

      teamRoleRequirementRepository.save(entity);
    }
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

  private String normalizeTeamExperienceLevel(String value) {
    String normalized = normalizeEnum(value, 20);
    return normalized == null ? "MIXED" : switch (normalized) {
      case "BEGINNER", "JUNIOR", "MID", "SENIOR", "MIXED" -> normalized;
      default -> throw new IllegalArgumentException("Dozwolone poziomy doświadczenia to: BEGINNER, JUNIOR, MID, SENIOR, MIXED.");
    };
  }

  private String normalizeRecruitmentStatus(String value) {
    String normalized = normalizeEnum(value, 20);
    return normalized == null ? "OPEN" : switch (normalized) {
      case "OPEN", "PAUSED", "CLOSED", "FULL" -> normalized;
      default -> throw new IllegalArgumentException("Dozwolone statusy rekrutacji to: OPEN, PAUSED, CLOSED, FULL.");
    };
  }

  private String normalizeEnum(String value, int maxLen) {
    String normalized = normalize(value, maxLen);
    if (normalized == null) return null;
    return normalized.toUpperCase(Locale.ROOT)
            .replace(' ', '_')
            .replace('-', '_');
  }

  private OffsetDateTime parseOffsetDateTime(String value, String errorMessage) {
    try {
      return OffsetDateTime.parse(value);
    } catch (DateTimeParseException ex) {
      throw new IllegalArgumentException(errorMessage);
    }
  }
}