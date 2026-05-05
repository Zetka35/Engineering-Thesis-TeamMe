export type TeamRoleInfo = {
  name:
    | "Inicjator Pomysłów"
    | "Koordynator Relacji"
    | "Realizator Zadań"
    | "Kontroler Jakości"
    | "Analityk Strategiczny"
    | "Filar Wsparcia"
    | "Łowca Informacji";
  shortDescription: string;
  collaborationStyle: string;
  strengths: string[];
  goodFitExamples: string[];
};

export const TEAM_ROLES_INFO: TeamRoleInfo[] = [
  {
    name: "Inicjator Pomysłów",
    shortDescription:
      "Wnosi energię twórczą, proponuje nowe kierunki działania i pomaga zespołowi wychodzić poza oczywiste rozwiązania.",
    collaborationStyle:
      "Najlepiej odnajduje się tam, gdzie potrzebne jest uruchamianie nowych koncepcji, pobudzanie dyskusji i inicjowanie zmian.",
    strengths: ["kreatywność", "inicjatywa", "szukanie nowych rozwiązań"],
    goodFitExamples: [
      "wymyślanie koncepcji produktu",
      "tworzenie nowych funkcji",
      "szukanie niestandardowych rozwiązań",
    ],
  },
  {
    name: "Koordynator Relacji",
    shortDescription:
      "Dba o komunikację, porządkuje współpracę i pomaga zespołowi utrzymać wspólny kierunek działania.",
    collaborationStyle:
      "Najsilniej wspiera zespół w sytuacjach, które wymagają synchronizacji pracy, jasnych ustaleń i sprawnego przepływu informacji.",
    strengths: ["komunikacja", "organizacja współpracy", "łagodzenie napięć"],
    goodFitExamples: [
      "koordynowanie pracy zespołu",
      "prowadzenie ustaleń",
      "spajanie zespołu wokół wspólnego celu",
    ],
  },
  {
    name: "Realizator Zadań",
    shortDescription:
      "Przekłada ustalenia na działanie, konsekwentnie doprowadza zadania do końca i dba o wykonanie planu.",
    collaborationStyle:
      "Najlepiej działa w środowisku, gdzie potrzebna jest systematyczność, odpowiedzialność i domykanie konkretnych działań.",
    strengths: ["systematyczność", "odpowiedzialność", "skuteczność wykonawcza"],
    goodFitExamples: [
      "realizacja backlogu",
      "wdrażanie ustalonych funkcji",
      "doprowadzanie prac do końca",
    ],
  },
  {
    name: "Kontroler Jakości",
    shortDescription:
      "Zwraca uwagę na szczegóły, standardy i zgodność rezultatów z oczekiwaniami zespołu lub projektu.",
    collaborationStyle:
      "Największą wartość wnosi tam, gdzie kluczowe są dokładność, dopracowanie i wykrywanie błędów przed oddaniem efektu pracy.",
    strengths: ["dokładność", "kontrola standardów", "wychwytywanie błędów"],
    goodFitExamples: [
      "testowanie",
      "weryfikacja jakości",
      "sprawdzanie zgodności z wymaganiami",
    ],
  },
  {
    name: "Analityk Strategiczny",
    shortDescription:
      "Porządkuje informacje, ocenia warianty działania i pomaga podejmować decyzje na podstawie logicznej analizy.",
    collaborationStyle:
      "Najlepiej sprawdza się, gdy zespół musi porównać opcje, zrozumieć problem i wybrać najbardziej racjonalny kierunek.",
    strengths: ["analiza", "myślenie strategiczne", "ocena wariantów"],
    goodFitExamples: [
      "analiza wymagań",
      "porównywanie rozwiązań",
      "planowanie kierunku projektu",
    ],
  },
  {
    name: "Filar Wsparcia",
    shortDescription:
      "Buduje stabilność współpracy, wzmacnia innych członków zespołu i pomaga utrzymać dobrą atmosferę pracy.",
    collaborationStyle:
      "Największą wartość wnosi tam, gdzie ważne jest wzajemne wsparcie, cierpliwość i gotowość do pomagania innym.",
    strengths: ["empatia", "wsparcie zespołu", "budowanie poczucia bezpieczeństwa"],
    goodFitExamples: [
      "pomoc mniej doświadczonym członkom",
      "wspieranie pracy zespołowej",
      "utrzymywanie dobrej atmosfery współpracy",
    ],
  },
  {
    name: "Łowca Informacji",
    shortDescription:
      "Szybko znajduje potrzebne dane, inspiracje i źródła, które pomagają zespołowi podejmować lepsze decyzje.",
    collaborationStyle:
      "Najlepiej odnajduje się w sytuacjach, które wymagają researchu, porządkowania wiedzy i dostarczania zespołowi użytecznych informacji.",
    strengths: ["research", "wyszukiwanie wiedzy", "selekcja informacji"],
    goodFitExamples: [
      "szukanie benchmarków",
      "analiza źródeł i inspiracji",
      "zbieranie wiedzy potrzebnej do realizacji projektu",
    ],
  },
];