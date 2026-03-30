package com.teamme.backend.service;

import com.teamme.backend.entity.*;
import com.teamme.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
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
          String nextMeetingAt
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

  public record TeamDetails(
          Long id,
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers,
          String status,
          String ownerUsername,
          String myRole,
          List<MemberView> members,
          List<MeetingView> meetings,
          List<TaskView> tasks
  ) {}

  public record TeamUpsert(
          String name,
          String description,
          String expectedTimeText,
          Integer maxMembers
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

  public TeamsService(
          UserRepository userRepository,
          TeamRepository teamRepository,
          TeamMemberRepository teamMemberRepository,
          TeamMeetingRepository teamMeetingRepository,
          TeamTaskRepository teamTaskRepository
  ) {
    this.userRepository = userRepository;
    this.teamRepository = teamRepository;
    this.teamMemberRepository = teamMemberRepository;
    this.teamMeetingRepository = teamMeetingRepository;
    this.teamTaskRepository = teamTaskRepository;
  }

  public List<TeamSummary> getTeamsForUser(String username) {
    userRepository.findByUsername(username).orElseThrow();

    return teamRepository.findAllForUsername(username).stream()
            .map(team -> {
              long memberCount = teamMemberRepository.countByTeam_Id(team.getId());
              String myRole = teamMemberRepository.findByTeam_IdAndUser_Username(team.getId(), username)
                      .map(TeamMember::getRoleLabel)
                      .orElse("Member");

              String nextMeetingAt = teamMeetingRepository.findByTeam_IdOrderByStartsAtAsc(team.getId()).stream()
                      .filter(m -> !m.getStartsAt().isBefore(OffsetDateTime.now()))
                      .findFirst()
                      .or(() -> teamMeetingRepository.findByTeam_IdOrderByStartsAtAsc(team.getId()).stream().findFirst())
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
                      nextMeetingAt
              );
            })
            .toList();
  }

  public TeamDetails getTeam(Long teamId, String username) {
    Team team = getAccessibleTeam(teamId, username);
    return toDetails(team, username);
  }

  public TeamDetails createTeam(TeamUpsert req, String username) {
    User owner = userRepository.findByUsername(username).orElseThrow();

    String name = normalize(req.name(), 200);
    if (name == null) throw new IllegalArgumentException("Nazwa zespołu jest wymagana.");

    Integer maxMembers = req.maxMembers() == null ? 4 : req.maxMembers();
    if (maxMembers < 1) throw new IllegalArgumentException("Liczba członków musi być większa od 0.");

    Team team = new Team();
    team.setName(name);
    team.setDescription(normalize(req.description(), 4000));
    team.setExpectedTimeText(normalize(req.expectedTimeText(), 120));
    team.setMaxMembers(maxMembers);
    team.setStatus("ACTIVE");
    team.setOwnerUser(owner);

    Team saved = teamRepository.save(team);

    TeamMember ownerMembership = new TeamMember();
    ownerMembership.setTeam(saved);
    ownerMembership.setUser(owner);
    ownerMembership.setRoleLabel("Owner");
    teamMemberRepository.save(ownerMembership);

    return toDetails(saved, username);
  }

  public TeamDetails updateTeam(Long teamId, TeamUpsert req, String username) {
    Team team = getOwnedTeam(teamId, username);

    String name = normalize(req.name(), 200);
    if (name == null) throw new IllegalArgumentException("Nazwa zespołu jest wymagana.");

    Integer maxMembers = req.maxMembers() == null ? team.getMaxMembers() : req.maxMembers();
    if (maxMembers < 1) throw new IllegalArgumentException("Liczba członków musi być większa od 0.");

    if (teamMemberRepository.countByTeam_Id(teamId) > maxMembers) {
      throw new IllegalArgumentException("Nie można ustawić limitu mniejszego niż aktualna liczba członków.");
    }

    team.setName(name);
    team.setDescription(normalize(req.description(), 4000));
    team.setExpectedTimeText(normalize(req.expectedTimeText(), 120));
    team.setMaxMembers(maxMembers);

    Team saved = teamRepository.save(team);
    return toDetails(saved, username);
  }

  public TeamDetails addMeeting(Long teamId, MeetingCreate req, String username) {
    Team team = getAccessibleTeam(teamId, username);
    User author = userRepository.findByUsername(username).orElseThrow();

    String title = normalize(req.title(), 200);
    if (title == null) throw new IllegalArgumentException("Tytuł spotkania jest wymagany.");
    if (req.startsAt() == null || req.startsAt().isBlank()) {
      throw new IllegalArgumentException("Data rozpoczęcia spotkania jest wymagana.");
    }

    TeamMeeting meeting = new TeamMeeting();
    meeting.setTeam(team);
    meeting.setTitle(title);
    meeting.setDescription(normalize(req.description(), 4000));
    meeting.setStartsAt(OffsetDateTime.parse(req.startsAt()));
    meeting.setEndsAt(req.endsAt() == null || req.endsAt().isBlank() ? null : OffsetDateTime.parse(req.endsAt()));
    meeting.setLocation(normalize(req.location(), 200));
    meeting.setCreatedByUser(author);

    teamMeetingRepository.save(meeting);
    return toDetails(team, username);
  }

  public TeamDetails addTask(Long teamId, TaskCreate req, String username) {
    Team team = getAccessibleTeam(teamId, username);
    User author = userRepository.findByUsername(username).orElseThrow();

    String title = normalize(req.title(), 200);
    if (title == null) throw new IllegalArgumentException("Tytuł zadania jest wymagany.");

    User assignee = null;
    if (req.assigneeUserId() != null) {
      if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, req.assigneeUserId())) {
        throw new IllegalArgumentException("Wybrany użytkownik nie należy do tego zespołu.");
      }
      assignee = userRepository.findById(req.assigneeUserId()).orElseThrow();
    }

    TeamTask task = new TeamTask();
    task.setTeam(team);
    task.setTitle(title);
    task.setDescription(normalize(req.description(), 4000));
    task.setStatus("TODO");
    task.setDueAt(req.dueAt() == null || req.dueAt().isBlank() ? null : OffsetDateTime.parse(req.dueAt()));
    task.setAssigneeUser(assignee);
    task.setCreatedByUser(author);

    teamTaskRepository.save(task);
    return toDetails(team, username);
  }

  private Team getAccessibleTeam(Long teamId, String username) {
    Team team = teamRepository.findById(teamId).orElseThrow();
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

  private TeamDetails toDetails(Team team, String username) {
    List<MemberView> members = teamMemberRepository.findByTeam_IdOrderByUser_UsernameAsc(team.getId()).stream()
            .map(tm -> new MemberView(
                    tm.getUser().getId(),
                    tm.getUser().getUsername(),
                    fullName(tm.getUser()),
                    tm.getRoleLabel()
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
            team.getOwnerUser() == null ? null : team.getOwnerUser().getUsername(),
            myRole,
            members,
            meetings,
            tasks
    );
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
}