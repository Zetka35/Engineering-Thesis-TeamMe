package com.teamme.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamme.backend.entity.User;
import com.teamme.backend.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurveyService {

  private static final int SURVEY_VERSION = 2;
  private static final int MINI_IPIP_SIZE = 20;
  private static final int TEAMWORK_SIZE = 12;
  private static final double ALPHA = 0.20;

  private static final Set<Integer> MINI_IPIP_REVERSED = Set.of(2, 3, 4, 6, 10, 12, 13, 14, 16, 20);
  private static final Set<Integer> TEAMWORK_REVERSED = Set.of(3, 7, 12);

  private final UserRepository userRepository;
  private final JdbcTemplate jdbc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public SurveyService(UserRepository userRepository, JdbcTemplate jdbc) {
    this.userRepository = userRepository;
    this.jdbc = jdbc;
  }

  public record SaveDraftRequest(
          List<Integer> miniIpipAnswers,
          List<Integer> teamworkAnswers,
          String currentPart,
          Integer currentPage
  ) {}

  public record CompleteRequest(
          List<Integer> miniIpipAnswers,
          List<Integer> teamworkAnswers
  ) {}

  public record DimensionScoreDto(
          String key,
          double rawScore,
          double normalizedScore
  ) {}

  public record RoleScoreDto(
          String key,
          double baseScore,
          double adjustmentScore,
          double finalScore,
          String explanation,
          boolean recommended
  ) {}

  public record SurveyResultDto(
          int surveyVersion,
          double alpha,
          List<DimensionScoreDto> bigFive,
          List<DimensionScoreDto> teamwork,
          List<RoleScoreDto> allRoles,
          List<RoleScoreDto> topRoles
  ) {}

  public record SurveyStateDto(
          int surveyVersion,
          String status,
          String currentPart,
          Integer currentPage,
          List<Integer> miniIpipAnswers,
          List<Integer> teamworkAnswers,
          String startedAt,
          String completedAt,
          SurveyResultDto result
  ) {}

  private enum SurveyStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED
  }

  private enum SurveyPart {
    INTRO,
    MINI_IPIP,
    TEAMWORK,
    RESULT
  }

  @Transactional(readOnly = true)
  public SurveyStateDto getMySurveyState(String username) {
    User user = loadUser(username);

    List<SurveyStateDto> rows = jdbc.query("""
                SELECT survey_version,
                       status,
                       current_part,
                       current_page,
                       mini_ipip_draft_answers,
                       teamwork_draft_answers,
                       started_at,
                       completed_at,
                       big_five_scores,
                       teamwork_scores,
                       role_scores,
                       top_roles
                FROM team_role_surveys
                WHERE user_id = ?
                """,
            (rs, rowNum) -> {
              List<Integer> miniIpipAnswers = readIntegerArray(rs.getArray("mini_ipip_draft_answers"), MINI_IPIP_SIZE);
              List<Integer> teamworkAnswers = readIntegerArray(rs.getArray("teamwork_draft_answers"), TEAMWORK_SIZE);

              OffsetDateTime startedAt = rs.getObject("started_at", OffsetDateTime.class);
              OffsetDateTime completedAt = rs.getObject("completed_at", OffsetDateTime.class);

              SurveyResultDto result = null;
              String bigFiveJson = rs.getString("big_five_scores");
              String teamworkJson = rs.getString("teamwork_scores");
              String roleScoresJson = rs.getString("role_scores");
              String topRolesJson = rs.getString("top_roles");

              if (bigFiveJson != null && teamworkJson != null && roleScoresJson != null && topRolesJson != null) {
                result = new SurveyResultDto(
                        rs.getInt("survey_version"),
                        ALPHA,
                        readDimensionScores(bigFiveJson),
                        readDimensionScores(teamworkJson),
                        readRoleScores(roleScoresJson),
                        readRoleScores(topRolesJson)
                );
              }

              return new SurveyStateDto(
                      rs.getInt("survey_version"),
                      safeStatus(rs.getString("status")).name(),
                      safePart(rs.getString("current_part")).name(),
                      rs.getInt("current_page"),
                      miniIpipAnswers,
                      teamworkAnswers,
                      startedAt == null ? null : startedAt.toString(),
                      completedAt == null ? null : completedAt.toString(),
                      result
              );
            },
            user.getId()
    );

    if (rows.isEmpty()) {
      return emptyState();
    }

    return rows.get(0);
  }

  public SurveyStateDto saveDraft(String username, SaveDraftRequest req) {
    User user = loadUser(username);

    List<Integer> miniIpipAnswers = sanitizeDraftAnswers(req.miniIpipAnswers(), MINI_IPIP_SIZE, "Mini-IPIP");
    List<Integer> teamworkAnswers = sanitizeDraftAnswers(req.teamworkAnswers(), TEAMWORK_SIZE, "Praca zespołowa");

    SurveyPart currentPart = safePart(req.currentPart());
    int currentPage = req.currentPage() == null ? 0 : Math.max(0, req.currentPage());

    OffsetDateTime now = OffsetDateTime.now();

    jdbc.update("""
                INSERT INTO team_role_surveys (
                    user_id,
                    survey_version,
                    status,
                    current_part,
                    current_page,
                    mini_ipip_draft_answers,
                    teamwork_draft_answers,
                    started_at
                )
                VALUES (?, ?, 'IN_PROGRESS', ?, ?, ?, ?, ?)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    survey_version = EXCLUDED.survey_version,
                    status = 'IN_PROGRESS',
                    current_part = EXCLUDED.current_part,
                    current_page = EXCLUDED.current_page,
                    mini_ipip_draft_answers = EXCLUDED.mini_ipip_draft_answers,
                    teamwork_draft_answers = EXCLUDED.teamwork_draft_answers,
                    started_at = COALESCE(team_role_surveys.started_at, EXCLUDED.started_at)
                """,
            user.getId(),
            SURVEY_VERSION,
            currentPart.name(),
            currentPage,
            miniIpipAnswers.toArray(new Integer[0]),
            teamworkAnswers.toArray(new Integer[0]),
            now
    );

    return getMySurveyState(username);
  }

  public SurveyStateDto complete(String username, CompleteRequest req) {
    User user = loadUser(username);

    List<Integer> miniIpipAnswers = requireCompletedAnswers(req.miniIpipAnswers(), MINI_IPIP_SIZE, "Mini-IPIP");
    List<Integer> teamworkAnswers = requireCompletedAnswers(req.teamworkAnswers(), TEAMWORK_SIZE, "Praca zespołowa");

    SurveyResultDto result = computeResult(miniIpipAnswers, teamworkAnswers);
    OffsetDateTime now = OffsetDateTime.now();

    String bigFiveJson = writeJson(result.bigFive());
    String teamworkJson = writeJson(result.teamwork());
    String roleScoresJson = writeJson(result.allRoles());
    String topRolesJson = writeJson(result.topRoles());

    jdbc.update("""
                INSERT INTO team_role_surveys (
                    user_id,
                    survey_version,
                    status,
                    current_part,
                    current_page,
                    mini_ipip_draft_answers,
                    teamwork_draft_answers,
                    big_five_scores,
                    teamwork_scores,
                    role_scores,
                    top_roles,
                    started_at,
                    completed_at
                )
                VALUES (?, ?, 'COMPLETED', 'RESULT', 0, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    survey_version = EXCLUDED.survey_version,
                    status = 'COMPLETED',
                    current_part = 'RESULT',
                    current_page = 0,
                    mini_ipip_draft_answers = EXCLUDED.mini_ipip_draft_answers,
                    teamwork_draft_answers = EXCLUDED.teamwork_draft_answers,
                    big_five_scores = EXCLUDED.big_five_scores,
                    teamwork_scores = EXCLUDED.teamwork_scores,
                    role_scores = EXCLUDED.role_scores,
                    top_roles = EXCLUDED.top_roles,
                    started_at = COALESCE(team_role_surveys.started_at, EXCLUDED.started_at),
                    completed_at = EXCLUDED.completed_at
                """,
            user.getId(),
            SURVEY_VERSION,
            miniIpipAnswers.toArray(new Integer[0]),
            teamworkAnswers.toArray(new Integer[0]),
            bigFiveJson,
            teamworkJson,
            roleScoresJson,
            topRolesJson,
            now,
            now
    );

    return getMySurveyState(username);
  }

  private SurveyResultDto computeResult(List<Integer> miniIpipAnswers, List<Integer> teamworkAnswers) {
    int[] mini = applyReverseKey(miniIpipAnswers, MINI_IPIP_REVERSED);
    int[] teamwork = applyReverseKey(teamworkAnswers, TEAMWORK_REVERSED);

    double e = mean(mini[0], mini[5], mini[10], mini[15]);
    double a = mean(mini[1], mini[6], mini[11], mini[16]);
    double c = mean(mini[2], mini[7], mini[12], mini[17]);
    double n = mean(mini[3], mini[8], mini[13], mini[18]);
    double o = mean(mini[4], mini[9], mini[14], mini[19]);
    double s = 6.0 - n;

    double nE = norm01(e);
    double nA = norm01(a);
    double nC = norm01(c);
    double nO = norm01(o);
    double nS = norm01(s);

    double l = mean(teamwork[0], teamwork[1], teamwork[2], teamwork[3]);
    double k = mean(teamwork[4], teamwork[5], teamwork[6], teamwork[7]);
    double w = mean(teamwork[8], teamwork[9], teamwork[10], teamwork[11]);

    double nL = norm01(l);
    double nK = norm01(k);
    double nW = norm01(w);

    List<DimensionScoreDto> bigFiveScores = List.of(
            new DimensionScoreDto("E", round2(e), round4(nE)),
            new DimensionScoreDto("A", round2(a), round4(nA)),
            new DimensionScoreDto("C", round2(c), round4(nC)),
            new DimensionScoreDto("N", round2(n), round4(norm01(n))),
            new DimensionScoreDto("O", round2(o), round4(nO)),
            new DimensionScoreDto("S", round2(s), round4(nS))
    );

    List<DimensionScoreDto> teamworkScores = List.of(
            new DimensionScoreDto("L", round2(l), round4(nL)),
            new DimensionScoreDto("K", round2(k), round4(nK)),
            new DimensionScoreDto("W", round2(w), round4(nW))
    );

    List<RoleScoreDto> roleScores = new ArrayList<>();

    roleScores.add(role(
            "Inicjator Pomysłów",
            0.60 * nO + 0.20 * nE - 0.10 * nC,
            0.10 * nL - 0.05 * (1.0 - nW),
            "Najczęściej dobrze odnajduje się w generowaniu pomysłów, testowaniu nowych kierunków i uruchamianiu inicjatyw."
    ));

    roleScores.add(role(
            "Koordynator Relacji",
            0.40 * nE + 0.40 * nA + 0.10 * nS,
            0.20 * nK + 0.10 * nL,
            "Najczęściej wzmacnia komunikację, dba o porozumienie i pomaga utrzymać dobrą atmosferę współpracy."
    ));

    roleScores.add(role(
            "Realizator Zadań",
            0.60 * nC + 0.20 * nE - 0.10 * nO,
            0.20 * nW,
            "Najczęściej dobrze działa w domykaniu zadań, pilnowaniu ustaleń i systematycznym doprowadzaniu pracy do końca."
    ));

    roleScores.add(role(
            "Kontroler Jakości",
            0.50 * nC + 0.30 * nS - 0.10 * nE,
            0.10 * nW + 0.10 * nK,
            "Najczęściej zwraca uwagę na standardy, spójność, szczegóły i ograniczanie ryzyka błędów."
    ));

    roleScores.add(role(
            "Analityk Strategiczny",
            0.40 * nO + 0.30 * nS - 0.20 * nE,
            0.10 * nK,
            "Najczęściej wspiera zespół przez analizę, porządkowanie problemów i spokojne ocenianie możliwych kierunków działania."
    ));

    roleScores.add(role(
            "Filar Wsparcia",
            0.60 * nA + 0.20 * nS - 0.10 * nE,
            0.20 * nK + 0.10 * nW,
            "Najczęściej pomaga zespołowi utrzymać współpracę, wspiera innych i dobrze działa w sytuacjach wymagających wyważenia stanowisk."
    ));

    roleScores.add(role(
            "Łowca Informacji",
            0.60 * nE + 0.30 * nO + 0.10 * nA,
            0.20 * nL,
            "Najczęściej dobrze odnajduje się w łączeniu ludzi, inicjowaniu kontaktu i reprezentowaniu zespołu na zewnątrz."
    ));

    roleScores.sort(Comparator.comparing(RoleScoreDto::finalScore).reversed());

    Set<String> recommendedKeys = roleScores.stream()
            .limit(3)
            .map(RoleScoreDto::key)
            .collect(Collectors.toCollection(LinkedHashSet::new));

    List<RoleScoreDto> allRoles = roleScores.stream()
            .map(r -> new RoleScoreDto(
                    r.key(),
                    r.baseScore(),
                    r.adjustmentScore(),
                    r.finalScore(),
                    r.explanation(),
                    recommendedKeys.contains(r.key())
            ))
            .toList();

    List<RoleScoreDto> topRoles = allRoles.stream()
            .filter(RoleScoreDto::recommended)
            .limit(3)
            .toList();

    return new SurveyResultDto(
            SURVEY_VERSION,
            ALPHA,
            bigFiveScores,
            teamworkScores,
            allRoles,
            topRoles
    );
  }

  private RoleScoreDto role(String key, double baseRaw, double deltaRaw, String explanation) {
    double adjustment = ALPHA * deltaRaw;
    double finalScore = clamp01(baseRaw + adjustment);

    return new RoleScoreDto(
            key,
            round4(clamp01(baseRaw)),
            round4(adjustment),
            round4(finalScore),
            explanation,
            false
    );
  }

  private int[] applyReverseKey(List<Integer> answers, Set<Integer> reversedItems) {
    int[] adjusted = new int[answers.size()];
    for (int i = 0; i < answers.size(); i++) {
      int itemNo = i + 1;
      int value = answers.get(i);
      adjusted[i] = reversedItems.contains(itemNo) ? (6 - value) : value;
    }
    return adjusted;
  }

  private List<Integer> sanitizeDraftAnswers(List<Integer> answers, int expectedSize, String sectionName) {
    if (answers == null) {
      return emptyAnswers(expectedSize);
    }

    if (answers.size() != expectedSize) {
      throw new IllegalArgumentException(sectionName + " wymaga dokładnie " + expectedSize + " odpowiedzi.");
    }

    List<Integer> cleaned = new ArrayList<>(expectedSize);
    for (int i = 0; i < answers.size(); i++) {
      Integer value = answers.get(i);
      if (value != null && (value < 1 || value > 5)) {
        throw new IllegalArgumentException(sectionName + ": odpowiedź nr " + (i + 1) + " musi być w zakresie 1-5.");
      }
      cleaned.add(value);
    }
    return cleaned;
  }

  private List<Integer> requireCompletedAnswers(List<Integer> answers, int expectedSize, String sectionName) {
    List<Integer> cleaned = sanitizeDraftAnswers(answers, expectedSize, sectionName);
    for (int i = 0; i < cleaned.size(); i++) {
      if (cleaned.get(i) == null) {
        throw new IllegalArgumentException(sectionName + ": brak odpowiedzi nr " + (i + 1) + ".");
      }
    }
    return cleaned;
  }

  private SurveyStateDto emptyState() {
    return new SurveyStateDto(
            SURVEY_VERSION,
            SurveyStatus.NOT_STARTED.name(),
            SurveyPart.INTRO.name(),
            0,
            emptyAnswers(MINI_IPIP_SIZE),
            emptyAnswers(TEAMWORK_SIZE),
            null,
            null,
            null
    );
  }

  private List<Integer> emptyAnswers(int size) {
    return new ArrayList<>(Collections.nCopies(size, (Integer) null));
  }

  private User loadUser(String username) {
    return userRepository.findByUsername(username).orElseThrow(() ->
            new IllegalArgumentException("Nie znaleziono użytkownika: " + username)
    );
  }

  private SurveyPart safePart(String value) {
    if (value == null || value.isBlank()) {
      return SurveyPart.INTRO;
    }

    try {
      return SurveyPart.valueOf(
              value.trim()
                      .toUpperCase(Locale.ROOT)
                      .replace('-', '_')
                      .replace(' ', '_')
      );
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("Nieprawidłowa część ankiety: " + value);
    }
  }

  private SurveyStatus safeStatus(String value) {
    if (value == null || value.isBlank()) {
      return SurveyStatus.NOT_STARTED;
    }

    try {
      return SurveyStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException ex) {
      return SurveyStatus.NOT_STARTED;
    }
  }

  private List<Integer> readIntegerArray(Array sqlArray, int expectedSize) throws SQLException {
    if (sqlArray == null) {
      return emptyAnswers(expectedSize);
    }

    Object[] raw = (Object[]) sqlArray.getArray();
    List<Integer> result = new ArrayList<>(expectedSize);

    for (Object value : raw) {
      result.add(value == null ? null : ((Number) value).intValue());
    }

    while (result.size() < expectedSize) {
      result.add(null);
    }

    if (result.size() > expectedSize) {
      return new ArrayList<>(result.subList(0, expectedSize));
    }

    return result;
  }

  private List<DimensionScoreDto> readDimensionScores(String json) {
    try {
      return objectMapper.readValue(json, new TypeReference<List<DimensionScoreDto>>() {});
    } catch (Exception e) {
      throw new RuntimeException("Nie udało się odczytać zapisanych wyników wymiarów ankiety.", e);
    }
  }

  private List<RoleScoreDto> readRoleScores(String json) {
    try {
      return objectMapper.readValue(json, new TypeReference<List<RoleScoreDto>>() {});
    } catch (Exception e) {
      throw new RuntimeException("Nie udało się odczytać zapisanych wyników ról.", e);
    }
  }

  private String writeJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception e) {
      throw new RuntimeException("Nie udało się zapisać danych ankiety do JSON.", e);
    }
  }

  private double mean(int a, int b, int c, int d) {
    return (a + b + c + d) / 4.0;
  }

  private double norm01(double valueOnOneToFiveScale) {
    return (valueOnOneToFiveScale - 1.0) / 4.0;
  }

  private double clamp01(double value) {
    return Math.max(0.0, Math.min(1.0, value));
  }

  private double round2(double value) {
    return Math.round(value * 100.0) / 100.0;
  }

  private double round4(double value) {
    return Math.round(value * 10000.0) / 10000.0;
  }
}