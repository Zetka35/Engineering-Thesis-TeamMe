export type Likert = 1 | 2 | 3 | 4 | 5;
export type SurveyStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type SurveyPart = "INTRO" | "MINI_IPIP" | "TEAMWORK" | "RESULT";

export interface SurveyQuestion {
  id: number;
  text: string;
}

export const SCALE_OPTIONS: Array<{ value: Likert; shortLabel: string; longLabel: string }> = [
  {
    value: 1,
    shortLabel: "1",
    longLabel: "To stwierdzenie całkowicie nietrafnie mnie opisuje",
  },
  {
    value: 2,
    shortLabel: "2",
    longLabel: "To stwierdzenie raczej mnie nie opisuje",
  },
  {
    value: 3,
    shortLabel: "3",
    longLabel: "To stwierdzenie jest wobec mnie ani trafne, ani nietrafne",
  },
  {
    value: 4,
    shortLabel: "4",
    longLabel: "To stwierdzenie raczej mnie opisuje",
  },
  {
    value: 5,
    shortLabel: "5",
    longLabel: "To stwierdzenie całkowicie trafnie mnie opisuje",
  },
];

export const MINI_IPIP_QUESTIONS: SurveyQuestion[] = [
  { id: 1, text: "Jestem duszą towarzystwa." },
  { id: 2, text: "Niezbyt obchodzą mnie inni ludzie." },
  { id: 3, text: "Zostawiam moje rzeczy gdzie popadnie." },
  { id: 4, text: "Zwykle jestem zrelaksowany/a." },
  { id: 5, text: "Mam bogate słownictwo." },
  { id: 6, text: "Trzymam się z boku." },
  { id: 7, text: "Jestem wyrozumiały/a dla uczuć innych ludzi." },
  { id: 8, text: "Bez zwłoki wypełniam codzienne obowiązki." },
  { id: 9, text: "Często martwię się czymś." },
  { id: 10, text: "Mam trudności ze zrozumieniem abstrakcyjnych pojęć." },
  { id: 11, text: "Rozmawiam z wieloma różnymi ludźmi na przyjęciach." },
  { id: 12, text: "Nie interesują mnie problemy innych ludzi." },
  { id: 13, text: "Często zapominam odkładać rzeczy na miejsce." },
  { id: 14, text: "Rzadko czuję się przygnębiony/a." },
  { id: 15, text: "Mam głowę pełną pomysłów." },
  { id: 16, text: "Wśród nieznajomych jestem małomówny/a." },
  { id: 17, text: "Znajduję czas dla innych." },
  { id: 18, text: "Postępuję zgodnie z harmonogramem." },
  { id: 19, text: "Często miewam huśtawki nastrojów." },
  { id: 20, text: "Nie mam zbyt bogatej wyobraźni." },
];

export const TEAMWORK_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    text: "Nie ma problemu z przejęciem inicjatywy, gdy zespół potrzebuje kierunku.",
  },
  {
    id: 2,
    text: "Potrafię klarownie rozdzielać zadania i oczekiwać rezultatów.",
  },
  {
    id: 3,
    text: "Wolę, gdy ktoś inny ustala priorytety i podejmuje decyzje.",
  },
  {
    id: 4,
    text: "Czuję się komfortowo prowadząc spotkania i podsumowując ustalenia.",
  },
  {
    id: 5,
    text: "W sytuacjach spornych staram się zrozumieć obie strony.",
  },
  {
    id: 6,
    text: "Umiem łagodzić napięcia i szukać kompromisu.",
  },
  {
    id: 7,
    text: "Gdy pojawia się konflikt, mam tendencję, by upierać się przy swoim.",
  },
  {
    id: 8,
    text: "Dobrze odnajduję się w łagodzeniu konfliktów między innymi osobami.",
  },
  {
    id: 9,
    text: "Gdy otrzymuję zadanie, upewniam się co do kryteriów i terminu.",
  },
  {
    id: 10,
    text: "Jeśli napotykam przeszkody, szybko sygnalizuję to zespołowi.",
  },
  {
    id: 11,
    text: "Dotrzymuję uzgodnionych standardów i sposobu wykonania.",
  },
  {
    id: 12,
    text: "Zdarza mi się realizować zadania po swojemu, nawet gdy ustalenia były inne.",
  },
];

export const ROLE_ORDER = [
  "Inicjator Pomysłów",
  "Koordynator Relacji",
  "Realizator Zadań",
  "Kontroler Jakości",
  "Analityk Strategiczny",
  "Filar Wsparcia",
  "Łowca Informacji",
] as const;

export function isLikert(value: unknown): value is Likert {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function emptyAnswers(size: number): Array<Likert | null> {
  return Array.from({ length: size }, () => null);
}

export function normalizeAnswers(
  values: Array<number | null | undefined> | null | undefined,
  expectedSize: number
): Array<Likert | null> {
  const result = emptyAnswers(expectedSize);

  if (!values?.length) return result;

  for (let i = 0; i < Math.min(values.length, expectedSize); i += 1) {
    const value = values[i];
    result[i] = isLikert(value) ? value : null;
  }

  return result;
}

export function surveyStatusLabel(status?: SurveyStatus | null) {
  switch (status) {
    case "IN_PROGRESS":
      return "Ankieta rozpoczęta";
    case "COMPLETED":
      return "Ankieta ukończona";
    case "NOT_STARTED":
    default:
      return "Ankieta jeszcze niewykonana";
  }
}