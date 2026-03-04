import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MINI_IPIP_QUESTIONS, type Likert } from "../survey/miniIpip";
import { fetchMySurvey, submitMySurvey } from "../api/survey.api";

const PER_PAGE = 5;
const SCALE: Likert[] = [1, 2, 3, 4, 5];

export default function Survey() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user) return null;
  const username = user.username;

  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<(Likert | null)[]>(Array(20).fill(null));
  const [step, setStep] = useState(0); // 0..3
  const [submitting, setSubmitting] = useState(false);
  const [resultMode, setResultMode] = useState(false);
  const [error, setError] = useState<string>("");

  // wynik pobrany/zapisany
  const [storedResult, setStoredResult] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMySurvey(username)
      .then((r) => {
        if (!mounted) return;
        if (r?.answers?.length === 20) {
          setAnswers(r.answers);
          setStoredResult(r);
          setResultMode(true); // jeśli już była ankieta, pokazujemy wynik
        }
      })
      .catch((e) => {
        if (!mounted) return;
        console.error(e);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [username]);

  const pageStart = step * PER_PAGE;
  const pageEnd = pageStart + PER_PAGE;

  const pageQuestions = useMemo(
    () =>
      MINI_IPIP_QUESTIONS.slice(pageStart, pageEnd).map((q, i) => ({
        index: pageStart + i,
        text: q,
      })),
    [pageStart, pageEnd]
  );

  const missingTotal = answers.filter((a) => a == null).length;

  const missingOnPage = useMemo(() => {
    return pageQuestions.filter((q) => answers[q.index] == null).length;
  }, [pageQuestions, answers]);

  function setAnswer(index: number, value: Likert) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  function nextStep() {
    setError("");
    if (missingOnPage > 0) {
      setError("Uzupełnij wszystkie odpowiedzi na tej stronie.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  async function finish() {
    setError("");
    if (missingTotal > 0) {
      setError("Uzupełnij wszystkie odpowiedzi (brakuje: " + missingTotal + ").");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitMySurvey(username, answers as Likert[]);
      setStoredResult(res);
      setResultMode(true);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się zapisać ankiety.");
    } finally {
      setSubmitting(false);
    }
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

  // ===== Widok wyniku =====
if (resultMode && storedResult) {
  const r = storedResult;
  const top3 = (r.topRoles ?? []).slice(0, 3) as { key: string; score: number; explanation: string }[];

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Proponowane role</h2>
          <p className="card-subtitle">
            Poniżej 3 role o najwyższym dopasowaniu. Skala dopasowania: 0–1 (im wyżej, tym lepiej).
          </p>
        </div>

        <div className="card-body">
          {error && <div className="alert">{error}</div>}

          <div className="result-box">
            <h3>Top 3 role (dopasowanie 0–1)</h3>

            <ol className="result-list">
              {top3.map((x) => (
                <li key={x.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <b>{x.key}</b>
                    <span className="pill">dopasowanie: {Math.max(0, Math.min(1, x.score)).toFixed(3)}</span>
                  </div>
                  <div className="muted">{x.explanation}</div>
                </li>
              ))}
            </ol>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-solid" onClick={() => nav("/teams")}>
              Przejdź do zespołów
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setResultMode(false);
                setStep(0);
              }}
            >
              Zmień odpowiedzi
            </button>
            <button className="btn btn-ghost" onClick={() => nav("/profile")}>
              Profil
            </button>
          </div>

          <p style={{ marginTop: 10, color: "var(--muted)", fontWeight: 700 }}>
            Zapisano: {new Date(r.completedAt).toLocaleString("pl-PL")}
          </p>
        </div>
      </section>
    </div>
  );
}

  // ===== Widok kroków =====
  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Ankieta: Mini-IPIP</h2>
          <p className="card-subtitle">
            Krok {step + 1}/4 — pytania {pageStart + 1}–{pageEnd} (skala 1 (całkowicie się nie zgadzam) – 5 (całkowicie się zgadzam)).
          </p>
        </div>

        <div className="card-body">
          {error && <div className="alert">{error}</div>}

          <div className="survey-list">
            {pageQuestions.map(({ index, text }) => (
              <div key={index} className="survey-item">
                <div className="survey-q">
                  <span className="survey-no">{index + 1}.</span> {text}
                </div>

                <div className="survey-scale" role="radiogroup" aria-label={`Pytanie ${index + 1}`}>
                  {SCALE.map((v) => (
                    <label key={v} className={`survey-pill ${answers[index] === v ? "active" : ""}`}>
                      <input
                        type="radio"
                        name={`q${index}`}
                        value={v}
                        checked={answers[index] === v}
                        onChange={() => setAnswer(index, v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => nav("/profile")}>
              Profil
            </button>

            <div style={{ flex: 1 }} />

            <button className="btn btn-ghost" disabled={step === 0} onClick={prevStep}>
              Wstecz
            </button>

            {step < 3 ? (
              <button className="btn btn-solid" onClick={nextStep}>
                Dalej
              </button>
            ) : (
              <button className="btn btn-solid" disabled={submitting} onClick={finish}>
                {submitting ? "Zapisywanie…" : "Zakończ"}
              </button>
            )}

            <span style={{ color: "var(--muted)", fontWeight: 800 }}>
              Brakuje odpowiedzi: {missingTotal}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}