package com.teamme.backend.controller;

import com.teamme.backend.service.SurveyService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/surveys/mini-ipip")
public class SurveyController {

  private final SurveyService surveyService;

  public SurveyController(SurveyService surveyService) {
    this.surveyService = surveyService;
  }

  public record SubmitRequest(@Size(min = 20, max = 20) List<@Min(1) @Max(5) Integer> answers) {}
  public record RoleScoreDto(String key, double score, String explanation) {}
  public record SurveyResponse(List<Integer> answers, List<RoleScoreDto> topRoles, String completedAt) {}

  @GetMapping("/me")
  public SurveyResponse myLatest() {
    String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
            .getAuthentication().getName();

    return surveyService.getMySurvey(username)
            .map(s -> new SurveyResponse(
                    s.answers(),
                    s.topRoles().stream()
                            .map(r -> new RoleScoreDto(r.key(), r.score(), r.explanation()))
                            .toList(),
                    s.completedAt()
            ))
            .orElse(null);
  }

  @PostMapping
  public SurveyResponse submit(@RequestBody SubmitRequest req) {
    String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
            .getAuthentication().getName();

    var saved = surveyService.saveMySurvey(username, req.answers());

    return new SurveyResponse(
            saved.answers(),
            saved.topRoles().stream()
                    .map(r -> new RoleScoreDto(r.key(), r.score(), r.explanation()))
                    .toList(),
            saved.completedAt()
    );
  }
}