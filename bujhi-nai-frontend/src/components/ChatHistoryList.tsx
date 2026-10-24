"use client";

import { useMemo } from "react";
import { MessageSquareText } from "lucide-react";
import { DEPARTMENT_STYLES } from "@/lib/departments";
import { formatCount, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEPARTMENT_META, type BoardExplanation } from "@/types/board";

interface ChatHistoryListProps {
  boards: BoardExplanation[];
  activeChatId: string | null;
  onSelect: (board: BoardExplanation) => void;
}

const createdTime = (board: BoardExplanation): number => {
  const time = Date.parse(board.createdAt);
  return Number.isNaN(time) ? 0 : time;
};

/**
 * One row per saved conversation, newest first. The API feed ranks samples and
 * helpful boards above recent ones, so chat order is re-sorted here instead.
 */
export function ChatHistoryList({
  boards,
  activeChatId,
  onSelect,
}: ChatHistoryListProps) {
  const chats = useMemo(
    () =>
      [...boards].sort(
        (a, b) =>
          createdTime(b) - createdTime(a) || b._id.localeCompare(a._id),
      ),
    [boards],
  );

  return (
    <ul role="list" className="space-y-1.5">
      {chats.map((board) => {
        const active = board._id === activeChatId;

        return (
          <li key={board._id}>
            <button
              type="button"
              onClick={() => onSelect(board)}
              aria-current={active ? "true" : undefined}
              aria-label={`চ্যাট খোলো: ${board.topicTitle}`}
              className={cn(
                "group/chat flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                active
                  ? "border-emerald-300/30 bg-emerald-400/[0.09]"
                  : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border transition-colors",
                  active
                    ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground group-hover/chat:text-foreground/80",
                )}
              >
                <MessageSquareText className="size-3.5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      DEPARTMENT_STYLES[board.department].dot,
                    )}
                  />
                  <span>{DEPARTMENT_META[board.department].short}</span>
                  <span aria-hidden>·</span>
                  <span>{formatShortDate(board.createdAt)}</span>
                  {board.isSample && (
                    <span className="rounded bg-amber-300/10 px-1 text-[9px] text-amber-200/90">
                      স্যাম্পল
                    </span>
                  )}
                  {active && (
                    <span className="ml-auto shrink-0 text-[9px] font-medium text-emerald-300/90">
                      খোলা আছে
                    </span>
                  )}
                </span>

                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug font-medium">
                  {board.topicTitle}
                </span>

                <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground/80">
                  <span className="truncate">{board.courseDetected}</span>
                  {board.hadAudioQuestion && (
                    <span className="shrink-0" aria-label="ভয়েসে প্রশ্ন">
                      🎙️
                    </span>
                  )}
                  <span className="shrink-0 tabular-nums">
                    · 👍 {formatCount(board.helpfulCount)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
