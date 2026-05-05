package com.teamme.backend.controller;

import com.teamme.backend.service.TaskCenterService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskCenterController {

    private final TaskCenterService taskCenterService;

    public TaskCenterController(TaskCenterService taskCenterService) {
        this.taskCenterService = taskCenterService;
    }

    private String currentUsername() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    @GetMapping
    public List<TaskCenterService.TaskBoardItem> myTasks() {
        return taskCenterService.getMyTasks(currentUsername());
    }

    @PutMapping("/{taskId}/status")
    public TaskCenterService.TaskBoardItem updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody TaskCenterService.UpdateTaskStatusRequest req
    ) {
        return taskCenterService.updateTaskStatus(taskId, req, currentUsername());
    }
}