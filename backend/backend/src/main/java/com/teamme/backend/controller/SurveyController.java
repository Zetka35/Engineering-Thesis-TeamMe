package com.teamme.backend.controller;

import com.teamme.backend.service.SurveyService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/surveys/team-role")
public class SurveyController {

  private final SurveyService surveyService;

  public SurveyController(SurveyService surveyService) {
    this.surveyService = surveyService;
  }

  @GetMapping("/me")
  public SurveyService.SurveyStateDto me() {
    return surveyService.getMySurveyState(currentUsername());
  }

  @PutMapping("/me/draft")
  public SurveyService.SurveyStateDto saveDraft(
          @RequestBody SurveyService.SaveDraftRequest req
  ) {
    return surveyService.saveDraft(currentUsername(), req);
  }

  @PostMapping("/me/complete")
  public SurveyService.SurveyStateDto complete(
          @RequestBody SurveyService.CompleteRequest req
  ) {
    return surveyService.complete(currentUsername(), req);
  }

  private String currentUsername() {
    return SecurityContextHolder.getContext().getAuthentication().getName();
  }
}