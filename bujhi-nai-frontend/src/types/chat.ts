import type { BoardExplanation } from "@/types/board";

export type ThreadItem = UserThreadItem | AssistantThreadItem;

export interface UserThreadItem {
  id: string;
  role: "user";
  question: string;
  department: BoardExplanation["department"];
  imageUrl?: string;
  hadAudio: boolean;
}

export interface AssistantThreadItem {
  id: string;
  role: "assistant";
  status: "pending" | "ready" | "error";
  board?: BoardExplanation;
  error?: string;
}
