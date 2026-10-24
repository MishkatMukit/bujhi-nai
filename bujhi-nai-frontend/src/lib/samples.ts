import type { Department } from "@/types/board";

export interface SampleBoard {
  /** Passed to `GET /boards?search=` so no Mongo id is hardcoded. */
  search: string;
  department: Department;
  course: string;
  title: string;
  emoji: string;
  accent: string;
}

/** One-click demo boards that exist in the seed script. */
export const SAMPLE_BOARDS: SampleBoard[] = [
  {
    search: "DFA",
    department: "CSE",
    course: "Theory of Computation",
    title: "DFA State Minimization",
    emoji: "🎯",
    accent: "from-emerald-400/20 to-teal-500/5 text-emerald-200",
  },
  {
    search: "Thevenin",
    department: "EEE",
    course: "Electrical Circuits II",
    title: "Thevenin Equivalent Circuit",
    emoji: "⚡",
    accent: "from-amber-400/20 to-orange-500/5 text-amber-200",
  },
  {
    search: "Break-Even",
    department: "BBA",
    course: "Managerial Accounting",
    title: "Break-Even Point Analysis",
    emoji: "📊",
    accent: "from-sky-400/20 to-indigo-500/5 text-sky-200",
  },
];
