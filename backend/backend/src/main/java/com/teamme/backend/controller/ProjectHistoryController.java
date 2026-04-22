package com.teamme.backend.controller;

import com.teamme.backend.service.ProjectHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-history")
public class ProjectHistoryController {

    private final ProjectHistoryService projectHistoryService;

    public ProjectHistoryController(ProjectHistoryService projectHistoryService) {
        this.projectHistoryService = projectHistoryService;
    }

    private String currentUsername() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    @GetMapping("/reviews/pending")
    public List<ProjectHistoryService.PendingReviewTargetView> pendingReviews() {
        return projectHistoryService.getPendingReviews(currentUsername());
    }

    @GetMapping("/reviews/given")
    public List<ProjectHistoryService.CollaborationReviewView> givenReviews() {
        return projectHistoryService.getGivenReviews(currentUsername());
    }

    @GetMapping("/reviews/received")
    public List<ProjectHistoryService.CollaborationReviewView> receivedReviews() {
        return projectHistoryService.getReceivedReviews(currentUsername());
    }

    @PostMapping("/reviews")
    public ProjectHistoryService.CollaborationReviewView saveReview(
            @RequestBody ProjectHistoryService.CollaborationReviewInput req
    ) {
        return projectHistoryService.saveReview(currentUsername(), req);
    }
}