export const DEPARTMENTS = ["CSE", "EEE", "BBA", "Pharmacy", "URC", "General"] as const;

export type Department = (typeof DEPARTMENTS)[number];

export interface StepByStepBangla {
  stepNumber: number;
  equationOrConcept: string;
  banglaExplanation: string;
}

export interface PracticeProblem {
  question: string;
  hint: string;
  solution: string;
}

export interface BoardExplanation {
  _id: string;
  department: Department;
  semester: string;
  courseDetected: string;
  topicTitle: string;
  imageBase64: string;
  studentQuestion: string;
  hadAudioQuestion: boolean;
  /** Print-ready study note: board transcription plus expanded topic theory. */
  cleanTranscription: string;
  specificAnswer: string;
  stepByStepBangla: StepByStepBangla[];
  examShortcutTip: string;
  practiceProblem: PracticeProblem;
  helpfulCount: number;
  isSample: boolean;
  /** Mongo dates arrive as ISO strings. */
  createdAt: string;
  updatedAt: string;
}

export interface HelpfulResult {
  helpfulCount: number;
}

export interface ApiEnvelope<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

/** Short, human labels for the department tabs and badges. */
export const DEPARTMENT_META: Record<Department, { label: string; short: string }> = {
  CSE: { label: "Computer Science", short: "CSE" },
  EEE: { label: "Electrical Engineering", short: "EEE" },
  BBA: { label: "Business Administration", short: "BBA" },
  Pharmacy: { label: "Pharmacy", short: "Pharmacy" },
  URC: { label: "Arabic & Islamic Studies", short: "URC" },
  General: { label: "General", short: "General" },
};
