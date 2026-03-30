export const MINI_IPIP_QUESTIONS = [
    "Jestem duszą towarzystwa.",
    "Niezbyt obchodzą mnie inni ludzie.",
    "Zostawiam moje rzeczy gdzie popadnie.",
    "Zwykle jestem zrelaksowany/a.",
    "Mam bogate słownictwo.",
    "Trzymam się z boku.",
    "Jestem wyrozumiały/a dla uczuć innych ludzi.",
    "Bez zwłoki wypełniam codzienne obowiązki.",
    "Często martwię się czymś.",
    "Mam trudności ze zrozumieniem abstrakcyjnych pojęć.",
    "Rozmawiam z wieloma różnymi ludźmi na przyjęciach.",
    "Nie interesują mnie problemy innych ludzi.",
    "Często zapominam odkładać rzeczy na miejsce.",
    "Rzadko czuję się przygnębiony/a.",
    "Mam głowę pełną pomysłów.",
    "Wśród nieznajomych jestem małomówny/a.",
    "Znajduję czas dla innych.",
    "Postępuję zgodnie z harmonogramem.",
    "Często miewam huśtawki nastrojów.",
    "Nie mam zbyt bogatej wyobraźni",
];
// 1-indeksowane numery pozycji odwracanych [R]
export const REVERSED_ITEMS = new Set([2, 3, 4, 6, 10, 12, 13, 14, 16, 20]);
// Skale: też 1-indeksowane
const SCALES = {
    E: [1, 6, 11, 16],
    A: [2, 7, 12, 17],
    C: [3, 8, 13, 18],
    N: [4, 9, 14, 19],
    O: [5, 10, 15, 20],
};
function reverseLikert(x) {
    // 6 - odpowiedź
    return (6 - x);
}
function mean(values) {
    const s = values.reduce((a, b) => a + b, 0);
    return s / values.length;
}
function norm01(x15) {
    // (x - 1)/4
    return (x15 - 1) / 4;
}
export function computeBigFive(rawAnswers) {
    if (rawAnswers.length !== 20)
        throw new Error("Oczekiwano 20 odpowiedzi.");
    // odpowiedzi po odwróceniach
    const adj = rawAnswers.map((v, idx) => {
        const itemNo = idx + 1;
        return REVERSED_ITEMS.has(itemNo) ? reverseLikert(v) : v;
    });
    const E = mean(SCALES.E.map((i) => adj[i - 1]));
    const A = mean(SCALES.A.map((i) => adj[i - 1]));
    const C = mean(SCALES.C.map((i) => adj[i - 1]));
    const N = mean(SCALES.N.map((i) => adj[i - 1]));
    const O = mean(SCALES.O.map((i) => adj[i - 1]));
    const S = 6 - N;
    const norm = {
        E: norm01(E),
        A: norm01(A),
        C: norm01(C),
        O: norm01(O),
        S: norm01(S),
    };
    return { E, A, C, N, O, S, norm };
}
export function computeRoleScores(norm) {
    const { E, A, C, O, S } = norm;
    const roles = [
        {
            key: "Inicjator Pomysłów",
            score: 0.60 * O + 0.20 * E - 0.10 * C,
            explanation: "Innowacja, eksperymentowanie.",
        },
        {
            key: "Koordynator Relacji",
            score: 0.40 * E + 0.40 * A + 0.10 * S,
            explanation: "Komunikacja i łączenie ludzi.",
        },
        {
            key: "Realizator Zadań",
            score: 0.60 * C + 0.20 * E - 0.10 * O,
            explanation: "Planowanie i dowożenie.",
        },
        {
            key: "Kontroler Jakości",
            score: 0.50 * C + 0.30 * S - 0.10 * E,
            explanation: "Standardy, detale, ryzyka.",
        },
        {
            key: "Analityk Strategiczny",
            score: 0.40 * O + 0.30 * S - 0.20 * E,
            explanation: "Analiza i krytyczne myślenie.",
        },
        {
            key: "Wspierający Zespołowy",
            score: 0.60 * A + 0.20 * S - 0.10 * E,
            explanation: "Pomoc i mediacja.",
        },
        {
            key: "Łącznik",
            score: 0.60 * E + 0.30 * O + 0.10 * A,
            explanation: "Sieciowanie i reprezentacja.",
        },
    ];
    roles.sort((a, b) => b.score - a.score);
    return roles;
}
export function computeSurveyResult(answers) {
    const bigFive = computeBigFive(answers);
    const roles = computeRoleScores(bigFive.norm);
    return {
        answers,
        bigFive,
        roles,
        topRoles: roles.slice(0, 3),
        completedAt: new Date().toISOString(),
    };
}
