export type TechnologyGroup = {
  label: string;
  options: string[];
};

export const TECHNOLOGY_GROUPS: TechnologyGroup[] = [
  {
    label: "Frontend",
    options: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Angular",
      "Vue",
      "Tailwind CSS",
      "Redux",
    ],
  },
  {
    label: "Backend",
    options: [
      "Java",
      "Spring Boot",
      "Node.js",
      "Express",
      "Python",
      "Django",
      "FastAPI",
      ".NET",
      "C#",
      "PHP",
    ],
  },
  {
    label: "Bazy danych",
    options: [
      "PostgreSQL",
      "MySQL",
      "MariaDB",
      "MongoDB",
      "SQLite",
      "Redis",
      "Firebase",
    ],
  },
  {
    label: "Mobile",
    options: [
      "Android",
      "Kotlin",
      "Java (Android)",
      "Flutter",
      "Dart",
      "React Native",
      "Swift",
      "iOS",
    ],
  },
  {
    label: "DevOps / Cloud",
    options: [
      "Docker",
      "Kubernetes",
      "GitHub Actions",
      "CI/CD",
      "AWS",
      "Azure",
      "Google Cloud",
      "Nginx",
    ],
  },
  {
    label: "Testy / jakość",
    options: [
      "JUnit",
      "Mockito",
      "Cypress",
      "Playwright",
      "Selenium",
      "Postman",
      "Swagger / OpenAPI",
    ],
  },
  {
    label: "Design / Product",
    options: [
      "Figma",
      "Adobe XD",
      "UX Research",
      "UI Design",
      "Product Discovery",
      "Miro",
      "Jira",
    ],
  },
  {
    label: "Data / AI",
    options: [
      "Pandas",
      "NumPy",
      "scikit-learn",
      "TensorFlow",
      "PyTorch",
      "Power BI",
      "Tableau",
    ],
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export const ALL_TECHNOLOGY_OPTIONS = TECHNOLOGY_GROUPS.flatMap((group) => group.options);

export function isCatalogTechnology(value?: string | null) {
  if (!value) return false;
  const normalized = normalize(value);
  return ALL_TECHNOLOGY_OPTIONS.some((item) => normalize(item) === normalized);
}