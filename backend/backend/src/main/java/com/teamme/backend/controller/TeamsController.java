package com.teamme.backend.controller;

import com.teamme.backend.service.TeamRecruitmentService;
import com.teamme.backend.service.TeamsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamsController {

  private final TeamsService teamsService;
  private final TeamRecruitmentService teamRecruitmentService;

  public TeamsController(
          TeamsService teamsService,
          TeamRecruitmentService teamRecruitmentService
  ) {
    this.teamsService = teamsService;
    this.teamRecruitmentService = teamRecruitmentService;
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

  @GetMapping("/search")
  public List<TeamsService.TeamSummary> searchTeams() {
    return teamsService.searchOpenTeams(currentUsername());
  }

  @GetMapping("/{teamId}")
  public TeamsService.TeamDetails getTeam(@PathVariable Long teamId) {
    return teamsService.getTeam(teamId, currentUsername());
  }

  @PostMapping
  public TeamsService.TeamDetails createTeam(@RequestBody TeamsService.TeamUpsert req) {
    return teamsService.createTeam(req, currentUsername());
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

  @PostMapping("/{teamId}/apply")
  public TeamRecruitmentService.RecruitmentRequestView applyToTeam(
          @PathVariable Long teamId,
          @RequestBody TeamRecruitmentService.ApplyRequest req
  ) {
    return teamRecruitmentService.applyToTeam(teamId, req, currentUsername());
  }

  @PostMapping("/{teamId}/invite")
  public TeamRecruitmentService.RecruitmentRequestView inviteToTeam(
          @PathVariable Long teamId,
          @RequestBody TeamRecruitmentService.InviteRequest req
  ) {
    return teamRecruitmentService.inviteToTeam(teamId, req, currentUsername());
  }

  @GetMapping("/{teamId}/requests")
  public List<TeamRecruitmentService.RecruitmentRequestView> listRequests(
          @PathVariable Long teamId
  ) {
    return teamRecruitmentService.listTeamRequests(teamId, currentUsername());
  }

  @GetMapping("/requests/mine")
  public List<TeamRecruitmentService.RecruitmentRequestView> myRecruitmentRequests() {
    return teamRecruitmentService.listMyRequests(currentUsername());
  }

  @PostMapping("/requests/{requestId}/respond")
  public TeamRecruitmentService.RecruitmentRequestView respondToRequest(
          @PathVariable Long requestId,
          @RequestBody TeamRecruitmentService.RespondRequest req
  ) {
    return teamRecruitmentService.respondToRequest(requestId, req, currentUsername());
  }
}