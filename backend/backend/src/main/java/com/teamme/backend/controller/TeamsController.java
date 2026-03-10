package com.teamme.backend.controller;

import com.teamme.backend.service.TeamsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamsController {

  private final TeamsService teamsService;

  public TeamsController(TeamsService teamsService) {
    this.teamsService = teamsService;
  }

  public record TeamDto(Long id, String name, String role, List<String> members, String meetingDate) {}

  @GetMapping
  public List<TeamDto> myTeams() {
    String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
        .getAuthentication().getName();
    return teamsService.getTeamsForUser(username).stream()
        .map(t -> new TeamDto(t.id(), t.name(), t.role(), t.members(), t.meetingDate()))
        .toList();
  }
}