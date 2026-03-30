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

  private String currentUsername() {
    return org.springframework.security.core.context.SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();
  }

  @GetMapping
  public List<TeamsService.TeamSummary> myTeams() {
    return teamsService.getTeamsForUser(currentUsername());
  }

  @PostMapping
  public TeamsService.TeamDetails createTeam(@RequestBody TeamsService.TeamUpsert req) {
    return teamsService.createTeam(req, currentUsername());
  }

  @GetMapping("/{teamId}")
  public TeamsService.TeamDetails getTeam(@PathVariable Long teamId) {
    return teamsService.getTeam(teamId, currentUsername());
  }

  @PutMapping("/{teamId}")
  public TeamsService.TeamDetails updateTeam(
          @PathVariable Long teamId,
          @RequestBody TeamsService.TeamUpsert req
  ) {
    return teamsService.updateTeam(teamId, req, currentUsername());
  }

  @PostMapping("/{teamId}/meetings")
  public TeamsService.TeamDetails addMeeting(
          @PathVariable Long teamId,
          @RequestBody TeamsService.MeetingCreate req
  ) {
    return teamsService.addMeeting(teamId, req, currentUsername());
  }

  @PostMapping("/{teamId}/tasks")
  public TeamsService.TeamDetails addTask(
          @PathVariable Long teamId,
          @RequestBody TeamsService.TaskCreate req
  ) {
    return teamsService.addTask(teamId, req, currentUsername());
  }
}