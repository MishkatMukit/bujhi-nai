"use client";

import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Mic,
  PenLine,
  RotateCcw,
  ScanText,
  Sigma,
  Sparkles,
} from "lucide-react";
import { ExplanationViewer } from "@/components/ExplanationViewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SAMPLE_BOARDS } from "@/lib/samples";
import { cn } from "@/lib/utils";
import { DEPARTMENT_META, type BoardExplanation } from "@/types/board";
import type { ThreadItem } from "@/types/chat";

interface ChatThreadProps {
  items: ThreadItem[];
  sampleLoading: string | null;
  onSelectSample: (search: string) => void;
  onOpenPanel: () => void;
  chatCount: number;
  onUpvote: (board: BoardExplanation) => void;
  onPrint: (board: BoardExplanation) => void;
  votedIds: ReadonlySet<string>;
  upvotingId: string | null;
  onRetry: (id: string) => void;
}

const FEATURES = [
  { icon: ScanText, label: "মেসি বোর্ডও পড়ে" },
  { icon: Mic, label: "বাংলা ভয়েস বোঝে" },
  { icon: Sigma, label: "LaTeX নোট" },
  { icon: PenLine, label: "প্র্যাকটিস প্রশ্ন" },
];

function Welcome({
  sampleLoading,
  onSelectSample,
  onOpenPanel,
  chatCount,
}: Pick<
  ChatThreadProps,
  "sampleLoading" | "onSelectSample" | "onOpenPanel" | "chatCount"
>) {
  return (
    <div className="animate-rise flex flex-1 flex-col justify-center py-4 sm:py-8">
      <div className="flex items-center gap-2 self-start rounded-full border border-emerald-300/20 bg-emerald-400/[0.07] px-3 py-1 text-[10.5px] font-medium text-emerald-200">
        <span className="size-1.5 animate-soft-pulse rounded-full bg-emerald-300" />
        Gemma 4 · IIUC স্টুডেন্টদের জন্য
      </div>

      <h2 className="mt-5 max-w-xl text-[28px] leading-[1.18] font-semibold tracking-tight text-balance sm:text-[36px]">
        হোয়াইটবোর্ডের লাইনটা{" "}
        <span className="bg-linear-to-r from-emerald-200 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
          এখন সহজ বাংলায়।
        </span>
      </h2>

      <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
        বোর্ডের ছবি দাও, দরকার হলে ৫ সেকেন্ডের ভয়েসে প্রশ্ন করো। বাকিটা
        স্টেপ-বাই-স্টেপ ব্যাখ্যা — পরীক্ষার শর্টকাট আর প্র্যাকটিস প্রশ্নসহ।
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {SAMPLE_BOARDS.map((sample) => {
          const loading = sampleLoading === sample.search;

          return (
            <button
              key={sample.search}
              type="button"
              onClick={() => onSelectSample(sample.search)}
              disabled={sampleLoading !== null}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br p-3 text-left transition-all",
                "hover:-translate-y-0.5 hover:border-emerald-300/25 hover:shadow-[0_18px_40px_-28px_oklch(0.79_0.155_162/0.7)]",
                "focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-60",
                sample.accent,
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                <span aria-hidden>{sample.emoji}</span>
                {sample.department}
              </span>
              <span className="mt-1.5 block text-[12.5px] leading-snug font-medium text-foreground">
                {sample.title}
              </span>
              <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                {sample.course}
              </span>
              {loading ? (
                <Loader2 className="absolute top-2.5 right-2.5 size-3.5 animate-spin text-emerald-300" />
              ) : (
                <ArrowUpRight className="absolute top-2.5 right-2.5 size-3.5 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] text-muted-foreground/70">
        {FEATURES.map((feature) => (
          <span key={feature.label} className="flex items-center gap-1.5">
            <feature.icon className="size-3 text-emerald-300/70" />
            {feature.label}
          </span>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenPanel}
        className="mt-4 gap-1.5 self-start px-0 text-[11px] text-emerald-300/90 hover:bg-transparent hover:text-emerald-200 lg:hidden"
      >
        তোমার {chatCount} টি চ্যাট দেখো
        <ArrowRight className="size-3" />
      </Button>
    </div>
  );
}

function PendingReply() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-200">
        <Loader2 className="size-3.5 animate-spin" />
        বোর্ড পড়ে ব্যাখ্যা সাজাচ্ছি…
      </div>
      <Skeleton className="mt-3 h-3 w-3/4 bg-white/[0.08]" />
      <Skeleton className="mt-2 h-3 w-full bg-white/[0.08]" />
      <Skeleton className="mt-2 h-3 w-5/6 bg-white/[0.08]" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full bg-white/[0.08]" />
        <Skeleton className="h-7 w-24 rounded-full bg-white/[0.08]" />
        <Skeleton className="h-7 w-24 rounded-full bg-white/[0.08]" />
      </div>
      <div className="mt-3 grid gap-2">
        <Skeleton className="h-16 w-full rounded-2xl bg-white/[0.08]" />
        <Skeleton className="h-16 w-full rounded-2xl bg-white/[0.08]" />
      </div>
    </div>
  );
}

function ErrorReply({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.05] p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-100">ব্যাখ্যাটা বানানো গেল না</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-red-200/80">{message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2.5 h-7 gap-1.5 border-red-300/25 bg-red-400/10 px-2.5 text-[11px] text-red-100 hover:bg-red-400/20"
          >
            <RotateCcw className="size-3" />
            আবার চেষ্টা করো
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ChatThread({
  items,
  sampleLoading,
  onSelectSample,
  onOpenPanel,
  chatCount,
  onUpvote,
  onPrint,
  votedIds,
  upvotingId,
  onRetry,
}: ChatThreadProps) {
  if (items.length === 0) {
    return (
      <Welcome
        sampleLoading={sampleLoading}
        onSelectSample={onSelectSample}
        onOpenPanel={onOpenPanel}
        chatCount={chatCount}
      />
    );
  }

  return (
    <div className="space-y-6 py-2">
      {items.map((item) => {
        if (item.role === "user") {
          return (
            <div key={item.id} className="animate-rise flex justify-end">
              <div className="max-w-[88%] space-y-2 sm:max-w-[76%]">
                {item.imageUrl && (
                  <div className="ml-auto w-fit overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt="তোমার আপলোড করা বোর্ড"
                      className="max-h-52 w-auto rounded-xl object-cover"
                    />
                  </div>
                )}
                <div className="rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-[0_16px_40px_-24px_oklch(0.79_0.155_162/0.55)]">
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {item.question ||
                      (item.hadAudio
                        ? "🎙️ ভয়েসে প্রশ্ন করেছি — এই বোর্ডটা বুঝিয়ে দাও"
                        : "এই বোর্ডটা বুঝিয়ে দাও")}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-primary-foreground/70">
                    <span>{DEPARTMENT_META[item.department].short}</span>
                    {item.hadAudio && (
                      <>
                        <span aria-hidden>·</span>
                        <span>ভয়েস</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            data-message-id={item.id}
            className="flex scroll-mt-3 gap-2.5 sm:gap-3"
          >
            <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.12] ring-1 ring-emerald-300/20">
              <Sparkles className="size-4 text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                <span className="font-medium text-foreground/70">বুঝি নাই</span>
                <span aria-hidden>·</span>
                <span>Gemma 4</span>
              </div>

              {item.status === "pending" && <PendingReply />}
              {item.status === "error" && (
                <ErrorReply
                  message={item.error ?? "কিছু একটা ভুল হয়েছে।"}
                  onRetry={() => onRetry(item.id)}
                />
              )}
              {item.status === "ready" && item.board && (
                <ExplanationViewer
                  key={item.board._id}
                  board={item.board}
                  onUpvote={onUpvote}
                  onPrint={onPrint}
                  voted={votedIds.has(item.board._id)}
                  upvoting={upvotingId === item.board._id}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
