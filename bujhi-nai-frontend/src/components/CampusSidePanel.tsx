"use client";

import { useId, useState } from "react";
import {
  AlertTriangle,
  LibraryBig,
  MessageSquareText,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { ArchiveBoardList } from "@/components/ArchiveBoardList";
import { ChatHistoryList } from "@/components/ChatHistoryList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DEPARTMENTS,
  DEPARTMENT_META,
  type BoardExplanation,
  type Department,
} from "@/types/board";

type PanelTab = "chats" | "archive";

const FILTERS: (Department | "ALL")[] = ["ALL", ...DEPARTMENTS];

const TABS: { value: PanelTab; label: string; icon: typeof LibraryBig }[] = [
  { value: "chats", label: "চ্যাট", icon: MessageSquareText },
  { value: "archive", label: "আর্কাইভ", icon: LibraryBig },
];

const HEADINGS: Record<
  PanelTab,
  { eyebrow: string; title: string; subtitle: string; footer: string }
> = {
  chats: {
    eyebrow: "Your Chats",
    title: "💬 তোমার সব চ্যাট",
    subtitle: "আগের ব্যাখ্যাগুলো আবার খোলো",
    footer: "যেকোনো চ্যাটে ক্লিক করো — পুরো ব্যাখ্যা আবার খুলে যাবে।",
  },
  archive: {
    eyebrow: "Campus Archive",
    title: "📚 IIUC ক্লাস আর্কাইভ",
    subtitle: "ক্লাসমেটদের কাজে লাগা ব্যাখ্যা",
    footer: "কাজে লাগলে 👍 চাপো — ভালো ব্যাখ্যা উপরে উঠবে।",
  },
};

interface CampusSidePanelProps {
  boards: BoardExplanation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  department: Department | "ALL";
  search: string;
  onDepartmentChange: (department: Department | "ALL") => void;
  onSearchChange: (search: string) => void;
  /** Opens the board's conversation in the main chat area. */
  onSelect: (board: BoardExplanation) => void;
  activeChatId: string | null;
  onUpvote: (board: BoardExplanation) => void;
  votedIds: ReadonlySet<string>;
  upvotingId: string | null;
  /** Only set inside the mobile sheet, which has no built-in close button. */
  onClose?: () => void;
}

function PanelSkeleton({ tab }: { tab: PanelTab }) {
  if (tab === "chats") {
    return (
      <div className="space-y-1.5" aria-hidden>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-2.5 rounded-xl border border-transparent bg-white/[0.02] px-2.5 py-2.5"
          >
            <Skeleton className="size-7 shrink-0 rounded-lg bg-white/10" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-2 w-16 bg-white/10" />
              <Skeleton className="mt-1.5 h-3 w-4/5 bg-white/10" />
              <Skeleton className="mt-1.5 h-2 w-1/2 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"
        >
          <Skeleton className="h-2 w-20 bg-white/10" />
          <Skeleton className="mt-2 h-3 w-full bg-white/10" />
          <Skeleton className="mt-1.5 h-3 w-2/3 bg-white/10" />
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-2 w-14 bg-white/10" />
            <Skeleton className="h-5 w-12 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampusSidePanel({
  boards,
  loading,
  error,
  onRetry,
  department,
  search,
  onDepartmentChange,
  onSearchChange,
  onSelect,
  activeChatId,
  onUpvote,
  votedIds,
  upvotingId,
  onClose,
}: CampusSidePanelProps) {
  const [tab, setTab] = useState<PanelTab>("chats");
  const panelId = useId();
  const tabId = (value: PanelTab) => `${panelId}-tab-${value}`;
  const bodyId = `${panelId}-body`;
  const isChats = tab === "chats";
  const heading = HEADINGS[tab];
  const filtered = department !== "ALL" || search.trim().length > 0;

  const emptyTitle = filtered
    ? "এই ফিল্টারে কিছু পাওয়া যায়নি"
    : isChats
      ? "এখনো কোনো চ্যাট নেই"
      : "আর্কাইভ এখনো খালি";

  const emptyBody = filtered
    ? "অন্য ডিপার্টমেন্ট বেছে নাও, বা সার্চটা মুছে দাও।"
    : isChats
      ? "বোর্ডের ছবি দিয়ে প্রশ্ন করো — প্রতিটা ব্যাখ্যা এখানে চ্যাট হিসেবে জমা হবে।"
      : "নতুন ব্যাখ্যা দিলে এখানে জমা হবে।";

  const resetFilters = () => {
    onDepartmentChange("ALL");
    onSearchChange("");
  };

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col"
      aria-label="চ্যাট আর ক্যাম্পাস আর্কাইভ"
    >
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">
              {isChats ? (
                <MessageSquareText className="size-3" />
              ) : (
                <LibraryBig className="size-3" />
              )}
              {heading.eyebrow}
            </div>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              {heading.title}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {heading.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="mt-0.5 h-5 border-white/10 bg-white/[0.03] text-[10px] text-muted-foreground"
            >
              {loading ? "…" : `${formatCount(boards.length)} টি`}
            </Badge>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="প্যানেল বন্ধ করো"
                className="-mr-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="চ্যাট আর আর্কাইভ"
          className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1"
        >
          {TABS.map(({ value, label, icon: Icon }) => {
            const active = tab === value;

            return (
              <button
                key={value}
                type="button"
                role="tab"
                id={tabId(value)}
                aria-selected={active}
                aria-controls={bodyId}
                onClick={() => setTab(value)}
                className={cn(
                  "flex h-7 items-center justify-center gap-1.5 rounded-lg text-[11.5px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                  active
                    ? "bg-emerald-400/[0.12] text-emerald-200 shadow-[inset_0_0_0_1px_oklch(0.79_0.155_162/0.18)]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="টপিক বা কোর্স খোঁজো…"
            aria-label="টপিক বা কোর্স খোঁজো"
            className="h-9 border-white/10 bg-white/[0.03] pr-8 pl-9 text-xs placeholder:text-muted-foreground/60 focus-visible:border-emerald-300/30 focus-visible:ring-emerald-300/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="সার্চ মুছে ফেলো"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex shrink-0 items-center gap-1.5 overflow-x-auto px-4 pb-3">
        {FILTERS.map((value) => {
          const active = department === value;
          const label = value === "ALL" ? "সব" : DEPARTMENT_META[value].short;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onDepartmentChange(value)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                active
                  ? "border-emerald-300/30 bg-emerald-400/[0.12] text-emerald-200"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        id={bodyId}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        className="chat-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4"
      >
        {loading && <PanelSkeleton tab={tab} />}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-3.5 text-center">
            <AlertTriangle className="mx-auto size-5 text-red-300" />
            <p className="mt-2 text-[11px] leading-relaxed text-red-200/90">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2.5 h-7 gap-1.5 border-red-300/25 bg-red-400/10 px-2.5 text-[11px] text-red-200 hover:bg-red-400/20"
            >
              <RotateCcw className="size-3" />
              আবার চেষ্টা করো
            </Button>
          </div>
        )}

        {!loading && !error && boards.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
              {isChats ? (
                <MessageSquareText className="size-5 text-muted-foreground" />
              ) : (
                <LibraryBig className="size-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs font-medium">{emptyTitle}</p>
            <p className="max-w-56 text-[11px] leading-relaxed text-muted-foreground">
              {emptyBody}
            </p>
            {filtered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-1 h-7 gap-1.5 border-white/10 px-2.5 text-[11px]"
              >
                <RotateCcw className="size-3" />
                ফিল্টার রিসেট
              </Button>
            )}
          </div>
        )}

        {!loading && !error && boards.length > 0 && (
          isChats ? (
            <ChatHistoryList
              boards={boards}
              activeChatId={activeChatId}
              onSelect={onSelect}
            />
          ) : (
            <ArchiveBoardList
              boards={boards}
              onSelect={onSelect}
              onUpvote={onUpvote}
              votedIds={votedIds}
              upvotingId={upvotingId}
            />
          )
        )}
      </div>

      <div className="shrink-0 border-t border-white/5 px-4 py-2.5">
        <p className="text-[10px] leading-relaxed text-muted-foreground/60">
          {heading.footer}
        </p>
      </div>
    </section>
  );
}
