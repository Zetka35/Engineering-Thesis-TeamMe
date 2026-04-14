import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  completeMySurvey,
  getMySurveyState,
  saveMySurveyDraft,
  type RoleScoreDto,
  type SurveyResultDto,
} from "../api/survey.api";
import { updateSelectedRole } from "../api/user.api";
import {
  MINI_IPIP_QUESTIONS,
  TEAMWORK_QUESTIONS,
  SCALE_OPTIONS,
  emptyAnswers,
  normalizeAnswers,
  surveyStatusLabel,
  type Likert,
  type SurveyPart,
} from "../survey/teamRoleSurvey";

const PART_PAGE_SIZE: Record<"MINI_IPIP" | "TEAMWORK", number> = {
  MINI_IPIP: 5,
  TEAMWORK: 4,
};

const inputBlockStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 12,
  background: "#fff",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pl-PL");
}

function completionInfo(result?: SurveyResultDto | null) {
  const all = result?.allRoles ?? [];
  const top = result?.topRoles ?? [];
  return { all, top };
}

export default function Survey() {
  const { user, setSelectedRole } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftInfo, setDraftInfo] = useState("");

  const [currentPart, setCurrentPart] = useState<SurveyPart>("INTRO");
  const [currentPage, setCurrentPage] = useState(0);

  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");
  const [result, setResult] = useState<SurveyResultDto | null>(null);

  const [miniIpipAnswers, setMiniIpipAnswers] = useState<Array<Likert | null>>(
    emptyAnswers(MINI_IPIP_QUESTIONS.length)
  );
  const [teamworkAnswers, setTeamworkAnswers] = useState<Array<Likert | null>>(
    emptyAnswers(TEAMWORK_QUESTIONS.length)
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const state = await getMySurveyState();
        if (!mounted) return;

        setStatus(state.status);
        setCurrentPart(state.currentPart);
        setCurrentPage(state.currentPage ?? 0);
        setStartedAt(state.startedAt ?? null);
        setCompletedAt(state.completedAt ?? null);
        setResult(state.result ?? null);

        setMiniIpipAnswers(normalizeAnswers(state.miniIpipAnswers, MINI_IPIP_QUESTIONS.length));
        setTeamworkAnswers(normalizeAnswers(state.teamworkAnswers, TEAMWORK_QUESTIONS.length));

        if (state.status === "COMPLETED" && state.result) {
          setCurrentPart("RESULT");
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Nie udało się pobrać ankiety.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (currentPart === "RESULT" || currentPart === "INTRO") return;

    const hasAnyAnswer =
      miniIpipAnswers.some((x) => x != null) || teamworkAnswers.some((x) => x != null);

    if (!hasAnyAnswer) return;

    const timer = window.setTimeout(async () => {
      try {
        await saveMySurveyDraft({
          miniIpipAnswers,
          teamworkAnswers,
          currentPart,
          currentPage,
        });
        setStatus("IN_PROGRESS");
        setDraftInfo("Wersja robocza ankiety została zapisana.");
      } catch (e: any) {
        setDraftInfo(e?.message ?? "Nie udało się zapisać wersji roboczej.");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [loading, currentPart, currentPage, miniIpipAnswers, teamworkAnswers]);

  if (!user) return null;

  const questions = currentPart === "TEAMWORK" ? TEAMWORK_QUESTIONS : MINI_IPIP_QUESTIONS;
  const answers = currentPart === "TEAMWORK" ? teamworkAnswers : miniIpipAnswers;
  const perPage = currentPart === "TEAMWORK" ? PART_PAGE_SIZE.TEAMWORK : PART_PAGE_SIZE.MINI_IPIP;
  const totalPages = Math.ceil(questions.length / perPage);
  const pageStart = currentPage * perPage;
  const pageEnd = pageStart + perPage;
  const pageQuestions = questions.slice(pageStart, pageEnd);

  const missingMini = miniIpipAnswers.filter((x) => x == null).length;
  const missingTeamwork = teamworkAnswers.filter((x) => x == null).length;
  const totalMissing = missingMini + missingTeamwork;

  const currentPageMissing = useMemo(() => {
    return pageQuestions.filter((_, index) => answers[pageStart + index] == null).length;
  }, [answers, pageQuestions, pageStart]);

  const overallStep =
    currentPart === "MINI_IPIP"
      ? currentPage + 1
      : currentPart === "TEAMWORK"
      ? 4 + currentPage + 1
      : 0;

  const { all: allRoles, top: topRoles } = completionInfo(result);

  function setAnswer(index: number, value: Likert) {
    setError("");
    setDraftInfo("");

    if (currentPart === "TEAMWORK") {
      setTeamworkAnswers((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
      return;
    }

    setMiniIpipAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function startSurvey() {
    setError("");
    setSuccessMsg("");
    setStatus("IN_PROGRESS");
    setCurrentPart("MINI_IPIP");
    setCurrentPage(0);
  }

  function resumeFromResults() {
    setError("");
    setSuccessMsg("");
    setStatus("IN_PROGRESS");
    setCurrentPart("MINI_IPIP");
    setCurrentPage(0);
  }

  function prevStep() {
    setError("");
    setSuccessMsg("");

    if (currentPart === "TEAMWORK" && currentPage === 0) {
      setCurrentPart("MINI_IPIP");
      setCurrentPage(3);
      return;
    }

    if (currentPart === "MINI_IPIP" && currentPage === 0) {
      setCurrentPart("INTRO");
      setCurrentPage(0);
      return;
    }

    setCurrentPage((prev) => Math.max(0, prev - 1));
  }

  function nextStep() {
    setError("");
    setSuccessMsg("");

    if (currentPageMissing > 0) {
      setError("Uzupełnij wszystkie odpowiedzi na tej stronie.");
      return;
    }

    if (currentPart === "MINI_IPIP") {
      if (currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
        return;
      }
      setCurrentPart("TEAMWORK");
      setCurrentPage(0);
      return;
    }

    if (currentPart === "TEAMWORK") {
      if (currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
        return;
      }
      void finishSurvey();
    }
  }

  async function finishSurvey() {
    setError("");
    setSuccessMsg("");

    if (missingMini > 0 || missingTeamwork > 0) {
      setError(`Uzupełnij wszystkie odpowiedzi. Brakuje: ${totalMissing}.`);
      return;
    }

    setSubmitting(true);

    try {
      const state = await completeMySurvey({
        miniIpipAnswers: miniIpipAnswers as Likert[],
        teamworkAnswers: teamworkAnswers as Likert[],
      });

      setStatus(state.status);
      setCurrentPart("RESULT");
      setCurrentPage(0);
      setStartedAt(state.startedAt ?? null);
      setCompletedAt(state.completedAt ?? null);
      setResult(state.result ?? null);
      setDraftInfo("");
      setSuccessMsg("Ankieta została ukończona. Możesz teraz wybrać rolę do profilu.");
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zakończyć ankiety.");
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseRole(roleKey: string) {
    setSavingRole(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await updateSelectedRole(roleKey);
      setSelectedRole(updated.selectedRole ?? null);
      setSuccessMsg(`Wybrana rola została zapisana: ${updated.selectedRole}`);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zapisać roli.");
    } finally {
      setSavingRole(false);
    }
  }

  function renderScaleLegend() {
    return (
      <div
        className="profile-block"
        style={{
          display: "grid",
          gap: 8,
          background: "#f8fbfc",
        }}
      >
        <div style={{ fontWeight: 900 }}>Skala odpowiedzi</div>
        <div className="muted" style={{ marginTop: 0 }}>
          1 — To stwierdzenie całkowicie nietrafnie mnie opisuje
        </div>
        <div className="muted" style={{ marginTop: 0 }}>
          5 — To stwierdzenie całkowicie trafnie mnie opisuje
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="card-body">Ładowanie ankiety…</div>
        </section>
      </div>
    );
  }

  if (currentPart === "INTRO") {
    return (
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Ankieta „Moja rola w zespole”</h2>
            <p className="card-subtitle">
              Ankieta pomaga wskazać role zespołowe, które mogą najlepiej pasować do Twojego stylu działania.
            </p>
          </div>

          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            {error && <div className="alert">{error}</div>}
            {successMsg && (
              <div
                className="alert"
                style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
              >
                {successMsg}
              </div>
            )}

            <div className="profile-block" style={{ display: "grid", gap: 10 }}>
              <div><b>Po co wypełniasz tę ankietę?</b></div>
              <div className="muted">
                Wynik ankiety jest wsparciem przy doborze roli w zespole oraz późniejszym dopasowywaniu do projektów.
                Jest to rekomendacja — po zakończeniu nadal możesz samodzielnie wybrać dowolną rolę.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              <div className="profile-block" style={{ display: "grid", gap: 8 }}>
                <div className="profile-block-title" style={{ marginBottom: 0 }}>
                  Część 1 z 2 — Mini-IPIP
                </div>
                <div className="muted">
                  Ta część dotyczy Twoich ogólnych predyspozycji i stylu działania.
                  Odpowiadaj, myśląc o sobie ogólnie, a nie tylko o jednej konkretnej sytuacji.
                </div>
                <div><b>Liczba pytań:</b> 20</div>
              </div>

              <div className="profile-block" style={{ display: "grid", gap: 8 }}>
                <div className="profile-block-title" style={{ marginBottom: 0 }}>
                  Część 2 z 2 — Praca zespołowa
                </div>
                <div className="muted">
                  Ta część dotyczy zachowania podczas współpracy: inicjatywy, komunikacji w sporach i pracy zadaniowej.
                </div>
                <div><b>Liczba pytań:</b> 12</div>
              </div>
            </div>

            {renderScaleLegend()}

            <div className="profile-block" style={{ display: "grid", gap: 8 }}>
              <div><b>Status:</b> {surveyStatusLabel(status)}</div>
              {startedAt && <div className="muted">Rozpoczęto: {formatDate(startedAt)}</div>}
              {completedAt && <div className="muted">Ukończono: {formatDate(completedAt)}</div>}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-solid" onClick={status === "COMPLETED" ? () => setCurrentPart("RESULT") : startSurvey}>
                {status === "COMPLETED"
                  ? "Zobacz wyniki"
                  : status === "IN_PROGRESS"
                  ? "Wznów ankietę"
                  : "Rozpocznij ankietę"}
              </button>

              <button className="btn btn-ghost" onClick={() => nav("/profile")}>
                Wróć do profilu
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (currentPart === "RESULT" && result) {
    return (
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Wynik ankiety</h2>
            <p className="card-subtitle">
              Oto pełna lista 7 ról. Top 3 zostały oznaczone jako rekomendowane na podstawie Twoich odpowiedzi.
            </p>
          </div>

          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            {error && <div className="alert">{error}</div>}
            {successMsg && (
              <div
                className="alert"
                style={{ background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" }}
              >
                {successMsg}
              </div>
            )}

            <div className="profile-block" style={{ display: "grid", gap: 8 }}>
              <div><b>Status:</b> {surveyStatusLabel(status)}</div>
              <div className="muted">Ukończono: {formatDate(completedAt)}</div>
              <div className="muted">
                Wynik ankiety jest wskazówką. Możesz przypisać do profilu jedną z rekomendowanych ról albo wybrać inną z pełnej listy.
              </div>
            </div>

            <div className="profile-block" style={{ display: "grid", gap: 10 }}>
              <div className="profile-block-title">Top 3 rekomendowane role</div>
              <div style={{ display: "grid", gap: 10 }}>
                {topRoles.map((role) => {
                  const isSelected = user.selectedRole === role.key;
                  return (
                    <div
                      key={role.key}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 14,
                        padding: 12,
                        background: "rgba(111,168,199,.08)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <b>{role.key}</b>
                        <span className="pill">Top 3</span>
                        <span className="pill">wynik: {role.finalScore.toFixed(3)}</span>
                        {isSelected && <span className="pill">wybrana rola</span>}
                      </div>

                      <div className="muted" style={{ marginTop: 8 }}>
                        {role.explanation}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <button
                          className={isSelected ? "btn btn-solid" : "btn btn-ghost"}
                          disabled={savingRole}
                          onClick={() => chooseRole(role.key)}
                        >
                          {savingRole ? "Zapisywanie…" : isSelected ? "Rola wybrana" : "Przypisz do profilu"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              <div className="profile-block" style={{ display: "grid", gap: 10 }}>
                <div className="profile-block-title">Wyniki pomocnicze — część 1</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.bigFive.map((score) => (
                    <span key={score.key} className="pill">
                      {score.key}: {score.rawScore.toFixed(2)} / {score.normalizedScore.toFixed(3)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-block" style={{ display: "grid", gap: 10 }}>
                <div className="profile-block-title">Wyniki pomocnicze — część 2</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.teamwork.map((score) => (
                    <span key={score.key} className="pill">
                      {score.key}: {score.rawScore.toFixed(2)} / {score.normalizedScore.toFixed(3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-block" style={{ display: "grid", gap: 10 }}>
              <div className="profile-block-title">Pełna lista 7 ról</div>

              <div style={{ display: "grid", gap: 10 }}>
                {allRoles.map((role: RoleScoreDto) => {
                  const isSelected = user.selectedRole === role.key;
                  return (
                    <div
                      key={role.key}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 14,
                        padding: 12,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <b>{role.key}</b>
                        {role.recommended && <span className="pill">Top 3</span>}
                        {isSelected && <span className="pill">wybrana rola</span>}
                        <span className="pill">wynik końcowy: {role.finalScore.toFixed(3)}</span>
                      </div>

                      <div className="muted" style={{ marginTop: 0 }}>
                        {role.explanation}
                      </div>

                      <div className="muted" style={{ marginTop: 0 }}>
                        wynik bazowy: {role.baseScore.toFixed(3)} | korekta modułu zespołowego: {role.adjustmentScore.toFixed(3)}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className={isSelected ? "btn btn-solid" : "btn btn-ghost"}
                          disabled={savingRole}
                          onClick={() => chooseRole(role.key)}
                        >
                          {savingRole ? "Zapisywanie…" : isSelected ? "Rola wybrana" : "Wybierz tę rolę"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-solid" onClick={() => nav("/profile")}>
                Wróć do profilu
              </button>
              <button className="btn btn-ghost" onClick={resumeFromResults}>
                Wypełnij ankietę ponownie
              </button>
              <button className="btn btn-ghost" onClick={() => nav("/teams")}>
                Przejdź do zespołów
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const title =
    currentPart === "TEAMWORK"
      ? "Część 2 z 2 — Praca zespołowa"
      : "Część 1 z 2 — Mini-IPIP";

  const subtitle =
    currentPart === "TEAMWORK"
      ? "Ta część dotyczy współpracy z innymi przy zadaniach i projektach."
      : "Ta część dotyczy Twoich ogólnych predyspozycji i stylu działania.";

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">
            Krok {overallStep}/7 — pytania {pageStart + 1}–{Math.min(pageEnd, questions.length)} z {questions.length}
          </p>
        </div>

        <div className="card-body" style={{ display: "grid", gap: 14 }}>
          {error && <div className="alert">{error}</div>}
          {draftInfo && (
            <div
              className="alert"
              style={{ background: "#f8fbfc", color: "#315564", borderColor: "#d6e6ec" }}
            >
              {draftInfo}
            </div>
          )}

          <div className="profile-block" style={{ display: "grid", gap: 8 }}>
            <div><b>Dlaczego są dwie części?</b></div>
            <div className="muted">
              Najpierw odpowiadasz na pytania o ogólne predyspozycje i styl działania.
              Następnie przechodzisz do pytań o zachowanie w pracy zespołowej.
              Połączenie obu części pozwala lepiej dopasować rekomendację roli.
            </div>
          </div>

          <div className="profile-block" style={{ display: "grid", gap: 8 }}>
            <div><b>Instrukcja do tej części</b></div>
            <div className="muted">{subtitle}</div>
          </div>

          {renderScaleLegend()}

          <div className="survey-list">
            {pageQuestions.map((question, indexOnPage) => {
              const absoluteIndex = pageStart + indexOnPage;
              return (
                <div key={question.id} className="survey-item">
                  <div className="survey-q">
                    <span className="survey-no">{question.id}.</span> {question.text}
                  </div>

                  <div
                    className="survey-scale"
                    role="radiogroup"
                    aria-label={`Pytanie ${question.id}`}
                  >
                    {SCALE_OPTIONS.map((option) => (
                      <label
                        key={`${question.id}-${option.value}`}
                        className={`survey-pill ${answers[absoluteIndex] === option.value ? "active" : ""}`}
                        title={option.longLabel}
                      >
                        <input
                          type="radio"
                          name={`q-${currentPart}-${question.id}`}
                          value={option.value}
                          checked={answers[absoluteIndex] === option.value}
                          onChange={() => setAnswer(absoluteIndex, option.value)}
                        />
                        {option.shortLabel}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="profile-block"
            style={{
              display: "grid",
              gap: 8,
              background: "#f8fbfc",
            }}
          >
            <div><b>Postęp</b></div>
            <div className="muted">
              Status: {surveyStatusLabel(status)} | Brakuje odpowiedzi: {totalMissing}
            </div>
            <div className="muted">
              Część 1: {MINI_IPIP_QUESTIONS.length - missingMini}/{MINI_IPIP_QUESTIONS.length} |
              Część 2: {TEAMWORK_QUESTIONS.length - missingTeamwork}/{TEAMWORK_QUESTIONS.length}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => nav("/profile")}>
              Profil
            </button>

            <div style={{ flex: 1 }} />

            <button className="btn btn-ghost" onClick={prevStep}>
              Wstecz
            </button>

            {currentPart === "TEAMWORK" && currentPage === totalPages - 1 ? (
              <button className="btn btn-solid" disabled={submitting} onClick={() => void finishSurvey()}>
                {submitting ? "Obliczanie wyniku…" : "Zakończ ankietę"}
              </button>
            ) : (
              <button className="btn btn-solid" onClick={nextStep}>
                Dalej
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}