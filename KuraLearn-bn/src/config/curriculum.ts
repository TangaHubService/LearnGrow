/**
 * Reference lists from the Rwanda Competence-Based Curriculum framework (REB).
 * Used to validate syllabus units and lesson plans, and to offer teachers fixed choices
 * instead of free text.
 */
export const GENERIC_COMPETENCES = [
  "Critical thinking and problem solving",
  "Creativity and innovation",
  "Research and problem solving",
  "Communication in official languages",
  "Cooperation, interpersonal relations and life skills",
  "Lifelong learning",
] as const;

export const CROSS_CUTTING_ISSUES = [
  "Genocide studies",
  "Environment and sustainability",
  "Gender",
  "Comprehensive sexuality education",
  "Peace and values education",
  "Financial education",
  "Standardisation culture",
  "Inclusive education",
] as const;

export type GenericCompetence = (typeof GENERIC_COMPETENCES)[number];
export type CrossCuttingIssue = (typeof CROSS_CUTTING_ISSUES)[number];

/** Where a syllabus unit came from. SAMPLE units are demo content to replace with the official syllabus. */
export const SYLLABUS_SOURCES = ["SAMPLE", "REB", "SCHOOL"] as const;
