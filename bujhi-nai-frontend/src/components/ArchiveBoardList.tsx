"use client";

import { Loader2, ThumbsUp } from "lucide-react";
import { DEPARTMENT_STYLES } from "@/lib/departments";
import { formatCount, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEPARTMENT_META, type BoardExplanation } from "@/types/board";

interface ArchiveBoardListProps {
  boards: BoardExplanation[];
  onSelect: (board: BoardExplanation) => void;
  onUpvote: (board: BoardExplanation) => void;
  votedIds: ReadonlySet<string>;
  upvotingId: string | null;
}

/** The upvote-able campus archive cards, shared by the desktop rail and mobile sheet. */
export function ArchiveBoardList({
  boards,
  onSelect,
  onUpvote,
  votedIds,
  upvotingId,
}: ArchiveBoardListProps) {
  return (
    <div className="space-y-2">
      {boards.map((board) => {
        const voted = votedIds.has(board._id);
        const upvoting = upvotingId === board._id;

        return (
          <div key={board._id} className="group/card relative">
            <button
              type="button"
              onClick={() => onSelect(board)}
              className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 pr-12 text-left transition-all hover:border-emerald-300/25 hover:bg-white/[0.05] focus-visible:border-emerald-300/40 focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-3 left-0 w-0.5 rounded-full bg-linear-to-b",
                  DEPARTMENT_STYLES[board.department].bar,
                )}
              />
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    DEPARTMENT_STYLES[board.department].dot,
                  )}
                />
                {DEPARTMENT_META[board.department].short}
                <span aria-hidden>·</span>
                <span>{formatShortDate(board.createdAt)}</span>
                {board.isSample && (
                  <span className="ml-0.5 rounded bg-amber-300/10 px-1 text-[9px] text-amber-200/90">
                    স্যাম্পল
                  </span>
                )}
              </span>

              <h4 className="mt-1 line-clamp-2 text-[12.5px] leading-snug font-medium">
                {board.topicTitle}
              </h4>
              <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                {board.courseDetected}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[9.5px] text-muted-foreground/70">
                {board.semester && <span className="truncate">{board.semester}</span>}
                {board.hadAudioQuestion && (
                  <span className="flex shrink-0 items-center gap-0.5">🎙️ ভয়েস</span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onUpvote(board)}
              disabled={voted || upvoting}
              aria-pressed={voted}
              aria-label={
                voted
                  ? "ইতিমধ্যে কাজে লেগেছে জানানো হয়েছে"
                  : "কাজে লেগেছে বলে ভোট দাও"
              }
              className={cn(
                "absolute right-2 bottom-2 inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                voted
                  ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-black/20 text-muted-foreground hover:border-emerald-300/25 hover:text-emerald-200",
              )}
            >
              {upvoting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ThumbsUp className={cn("size-3", voted && "fill-current")} />
              )}
              {formatCount(board.helpfulCount)}
            </button>
          </div>
        );
      })}
    </div>
  );
}
