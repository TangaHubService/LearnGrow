/**
 * Rwanda national grading preset, modelled on the NESA letter grades.
 *
 * Grade points run from 6 (highest) to 0 (lowest) and the national pass mark is 50%.
 * Bands follow the 80/70/60/50/40/30 cut-offs published for P6, S3 and S6.
 * Schools can still edit their own scale from settings; this is the starting point
 * for every new school and the "reset to national preset" action.
 */
export const RWANDA_PASS_MARK = 50;

export type GradingBand = {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  description: string;
  points: number;
  remarks: string;
};

export const RWANDA_NESA_GRADING_SCALE: readonly GradingBand[] = Object.freeze([
  { minPercentage: 80, maxPercentage: 100, grade: "A", description: "Excellent", points: 6, remarks: "Outstanding performance" },
  { minPercentage: 70, maxPercentage: 79.99, grade: "B", description: "Very good", points: 5, remarks: "Very strong understanding" },
  { minPercentage: 60, maxPercentage: 69.99, grade: "C", description: "Good", points: 4, remarks: "Good grasp of the competences" },
  { minPercentage: 50, maxPercentage: 59.99, grade: "D", description: "Satisfactory", points: 3, remarks: "Meets the pass mark" },
  { minPercentage: 40, maxPercentage: 49.99, grade: "E", description: "Adequate", points: 2, remarks: "Below the pass mark, needs support" },
  { minPercentage: 30, maxPercentage: 39.99, grade: "S", description: "Subsidiary", points: 1, remarks: "Minimum level, needs close support" },
  { minPercentage: 0, maxPercentage: 29.99, grade: "F", description: "Fail", points: 0, remarks: "Significant support needed" },
]);

export function gradeForPercentage(percentage: number, scale: readonly Pick<GradingBand, "minPercentage" | "maxPercentage" | "grade">[] = RWANDA_NESA_GRADING_SCALE) {
  const sorted = [...scale].sort((a, b) => b.minPercentage - a.minPercentage);
  // Compare against the lower bound only, so scores between bands (e.g. 79.995) still land in one.
  return sorted.find((band) => percentage >= band.minPercentage) ?? sorted[sorted.length - 1];
}
