package com.teamme.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamme.backend.entity.User;
import com.teamme.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class SurveyService {

  private final UserRepository userRepository;
  private final JdbcTemplate jdbc;
  private final ObjectMapper om = new ObjectMapper();

  public SurveyService(UserRepository userRepository, JdbcTemplate jdbc) {
    this.userRepository = userRepository;
    this.jdbc = jdbc;
  }

  public record RoleScoreDto(String key, double score, String explanation) {}
  public record SurveyView(List<Integer> answers, List<RoleScoreDto> topRoles, String completedAt) {}

  private static final Set<Integer> REVERSED = Set.of(2,3,4,6,10,12,13,14,16,20);

  @Transactional
  public SurveyView saveMySurvey(String username, List<Integer> answers) {
    User u = userRepository.findByUsername(username).orElseThrow();
    if (answers.size() != 20) throw new IllegalArgumentException("Oczekiwano 20 odpowiedzi.");

    // odwrócenia
    int[] adj = new int[20];
    for (int i = 0; i < 20; i++) {
      int itemNo = i + 1;
      int v = answers.get(i);
      adj[i] = REVERSED.contains(itemNo) ? (6 - v) : v;
    }

    double E = mean(adj[0], adj[5], adj[10], adj[15]);
    double A = mean(adj[1], adj[6], adj[11], adj[16]);
    double C = mean(adj[2], adj[7], adj[12], adj[17]);
    double N = mean(adj[3], adj[8], adj[13], adj[18]);
    double O = mean(adj[4], adj[9], adj[14], adj[19]);
    double S = 6.0 - N;

    double nE = norm01(E), nA = norm01(A), nC = norm01(C), nO = norm01(O), nS = norm01(S);

    List<RoleScoreDto> roles = new ArrayList<>();
    roles.add(new RoleScoreDto("Inicjator Pomysłów", 0.60*nO + 0.20*nE - 0.10*nC, "Innowacja, eksperymentowanie (O↑, E↑, C↓)."));
    roles.add(new RoleScoreDto("Koordynator Relacji", 0.40*nE + 0.40*nA + 0.10*nS, "Komunikacja i łączenie ludzi (E↑, A↑, S↑)."));
    roles.add(new RoleScoreDto("Realizator Zadań", 0.60*nC + 0.20*nE - 0.10*nO, "Planowanie i dowożenie (C↑, E↑, O↓)."));
    roles.add(new RoleScoreDto("Kontroler Jakości", 0.50*nC + 0.30*nS - 0.10*nE, "Standardy, detale, ryzyka (C↑, S↑, E↓)."));
    roles.add(new RoleScoreDto("Analityk Strategiczny", 0.40*nO + 0.30*nS - 0.20*nE, "Analiza i krytyczne myślenie (O↑, S↑, E↓)."));
    roles.add(new RoleScoreDto("Wspierający Zespołowy", 0.60*nA + 0.20*nS - 0.10*nE, "Pomoc i mediacja (A↑, S↑, E↓)."));
    roles.add(new RoleScoreDto("Łącznik", 0.60*nE + 0.30*nO + 0.10*nA, "Sieciowanie i reprezentacja (E↑, O↑, A↑)."));

    // sort + top3 + clamp 0..1
    roles.sort((a,b) -> Double.compare(b.score(), a.score()));
    List<RoleScoreDto> top3 = roles.stream().limit(3)
        .map(r -> new RoleScoreDto(r.key(), clamp01(r.score()), r.explanation()))
        .toList();

    OffsetDateTime now = OffsetDateTime.now();

    try {
      String topRolesJson = om.writeValueAsString(top3);
      // UPSERT po user_id
      jdbc.update("""
          INSERT INTO mini_ipip_surveys(user_id, answers, top_roles, completed_at)
          VALUES (?, ?, ?::jsonb, ?)
          ON CONFLICT (user_id)
          DO UPDATE SET answers = EXCLUDED.answers, top_roles = EXCLUDED.top_roles, completed_at = EXCLUDED.completed_at
          """,
          u.getId(),
          answers.toArray(new Integer[0]),
          topRolesJson,
          now
      );
    } catch (Exception e) {
      throw new RuntimeException("Nie udało się zapisać ankiety", e);
    }

    return new SurveyView(answers, top3, now.toString());
  }

  public Optional<SurveyView> getMySurvey(String username) {
    User u = userRepository.findByUsername(username).orElseThrow();

    List<SurveyView> rows = jdbc.query("""
      SELECT answers, top_roles, completed_at
      FROM mini_ipip_surveys
      WHERE user_id = ?
      """,
            (rs, rowNum) -> {
              Integer[] answersArr = (Integer[]) rs.getArray("answers").getArray();
              String topRolesJson = rs.getString("top_roles");
              OffsetDateTime completedAt = rs.getObject("completed_at", OffsetDateTime.class);

              @SuppressWarnings("unchecked")
              List<Map<String, Object>> parsed;
              try {
                parsed = om.readValue(topRolesJson, List.class);
              } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw new RuntimeException("Nie udało się zparsować top_roles JSON", e);
              }

              List<RoleScoreDto> topRoles = parsed.stream()
                      .map(m -> new RoleScoreDto(
                              String.valueOf(m.get("key")),
                              clamp01(Double.parseDouble(String.valueOf(m.get("score")))),
                              String.valueOf(m.get("explanation"))
                      ))
                      .toList();

              return new SurveyView(List.of(answersArr), topRoles, completedAt.toString());
            },
            u.getId()
    );

    if (rows.isEmpty()) return Optional.empty();
    return Optional.of(rows.get(0));
  }

  private static double mean(int a, int b, int c, int d) { return (a+b+c+d)/4.0; }
  private static double norm01(double x15) { return (x15 - 1.0) / 4.0; }
  private static double clamp01(double v) { return Math.max(0.0, Math.min(1.0, v)); }
}