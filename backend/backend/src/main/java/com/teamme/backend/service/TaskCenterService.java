package com.teamme.backend.service;

import com.teamme.backend.entity.Team;
import com.teamme.backend.entity.TeamMember;
import com.teamme.backend.entity.TeamTask;
import com.teamme.backend.entity.User;
import com.teamme.backend.repository.TeamMemberRepository;
import com.teamme.backend.repository.TeamTaskRepository;
import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskCenterService {

    public record TaskBoardItem(
            Long id,
            Long teamId,
            String teamName,
            String teamStatus,
            String title,
            String description,
            String status,
            String dueAt,
            Long assigneeUserId,
            String assigneeUsername,
            String createdByUsername,
            String createdAt,
            String updatedAt,
            boolean assignedToMe,
            boolean overdue
    ) {}

    public record UpdateTaskStatusRequest(
            String status
    ) {}

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamTaskRepository teamTaskRepository;

    public TaskCenterService(
            UserRepository userRepository,
            TeamMemberRepository teamMemberRepository,
            TeamTaskRepository teamTaskRepository
    ) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamTaskRepository = teamTaskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskBoardItem> getMyTasks(String username) {
        loadUser(username);

        Map<Long, Team> myActiveTeams = teamMemberRepository.findByUser_UsernameOrderByJoinedAtDesc(username).stream()
                .filter(member -> member.getLeftAt() == null)
                .map(TeamMember::getTeam)
                .filter(team -> team != null)
                .collect(Collectors.toMap(
                        Team::getId,
                        Function.identity(),
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        Comparator<TeamTask> comparator = Comparator
                .comparing(TeamTask::getDueAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TeamTask::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));

        return myActiveTeams.values().stream()
                .flatMap(team -> teamTaskRepository.findByTeam_IdOrderByCreatedAtDesc(team.getId()).stream())
                .sorted(comparator)
                .map(task -> toView(task, username))
                .toList();
    }

    public TaskBoardItem updateTaskStatus(Long taskId, UpdateTaskStatusRequest req, String username) {
        loadUser(username);

        TeamTask task = teamTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zadania."));

        if (!teamMemberRepository.existsByTeam_IdAndUser_Username(task.getTeam().getId(), username)) {
            throw new IllegalArgumentException("Nie masz dostępu do tego zadania.");
        }

        if (!"ACTIVE".equals(task.getTeam().getStatus())) {
            throw new IllegalArgumentException("Status zadania można zmieniać tylko w aktywnym projekcie.");
        }

        task.setStatus(normalizeTaskStatus(req.status()));
        TeamTask saved = teamTaskRepository.save(task);

        return toView(saved, username);
    }

    private TaskBoardItem toView(TeamTask task, String username) {
        boolean assignedToMe =
                task.getAssigneeUser() != null &&
                        username.equals(task.getAssigneeUser().getUsername());

        boolean overdue =
                task.getDueAt() != null &&
                        task.getDueAt().isBefore(OffsetDateTime.now()) &&
                        !"DONE".equals(task.getStatus());

        return new TaskBoardItem(
                task.getId(),
                task.getTeam().getId(),
                task.getTeam().getName(),
                task.getTeam().getStatus(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getDueAt() == null ? null : task.getDueAt().toString(),
                task.getAssigneeUser() == null ? null : task.getAssigneeUser().getId(),
                task.getAssigneeUser() == null ? null : task.getAssigneeUser().getUsername(),
                task.getCreatedByUser() == null ? null : task.getCreatedByUser().getUsername(),
                task.getCreatedAt() == null ? null : task.getCreatedAt().toString(),
                task.getUpdatedAt() == null ? null : task.getUpdatedAt().toString(),
                assignedToMe,
                overdue
        );
    }

    private String normalizeTaskStatus(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Status zadania jest wymagany.");
        }

        String normalized = value.trim()
                .toUpperCase(Locale.ROOT)
                .replace(' ', '_')
                .replace('-', '_');

        return switch (normalized) {
            case "TODO", "IN_PROGRESS", "DONE" -> normalized;
            default -> throw new IllegalArgumentException("Dozwolone statusy zadania to: TODO, IN_PROGRESS, DONE.");
        };
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika: " + username));
    }
}