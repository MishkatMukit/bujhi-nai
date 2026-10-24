import type { Department } from "@/types/board";

/** Static Tailwind classes per department so nothing is purged. */
export const DEPARTMENT_STYLES: Record<Department, { chip: string; dot: string; bar: string }> = {
  CSE: {
    chip: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    dot: "bg-emerald-300",
    bar: "from-emerald-300/80 to-teal-500/30",
  },
  EEE: {
    chip: "border-amber-300/25 bg-amber-400/10 text-amber-200",
    dot: "bg-amber-300",
    bar: "from-amber-300/80 to-orange-500/30",
  },
  BBA: {
    chip: "border-sky-300/25 bg-sky-400/10 text-sky-200",
    dot: "bg-sky-300",
    bar: "from-sky-300/80 to-indigo-500/30",
  },
  Pharmacy: {
    chip: "border-rose-300/25 bg-rose-400/10 text-rose-200",
    dot: "bg-rose-300",
    bar: "from-rose-300/80 to-pink-500/30",
  },
  URC: {
    chip: "border-violet-300/25 bg-violet-400/10 text-violet-200",
    dot: "bg-violet-300",
    bar: "from-violet-300/80 to-purple-500/30",
  },
  General: {
    chip: "border-white/15 bg-white/5 text-foreground/70",
    dot: "bg-white/50",
    bar: "from-white/40 to-white/10",
  },
};
