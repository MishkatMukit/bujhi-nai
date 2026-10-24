"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Loader2, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_BOARDS } from "@/lib/samples";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSelectSample: (search: string) => void;
  sampleLoading: string | null;
  onOpenPanel: () => void;
  chatCount: number;
  onNewChat: () => void;
  hasThread: boolean;
}

/** Drop the brand image at `public/logo.png`; the Sparkles mark is the fallback. */
const LOGO_SRC = "/logo.png";

function BrandMark() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Preload instead of relying on <img onError>: a missing file can fail
    // before React hydrates, which would leave an empty box behind.
    const image = new Image();
    image.onload = () => setReady(true);
    image.src = LOGO_SRC;

    return () => {
      image.onload = null;
    };
  }, []);

  if (!ready) {
    return (
      <div className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-emerald-300 via-emerald-400 to-teal-600 shadow-[0_0_36px_-8px_oklch(0.79_0.155_162/0.8)]">
        <Sparkles className="size-5 text-emerald-950" strokeWidth={2.4} />
      </div>
    );
  }

  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="বুঝি নাই লোগো"
        className="size-full object-contain"
      />
    </div>
  );
}

export function Header({
  onSelectSample,
  sampleLoading,
  onOpenPanel,
  chatCount,
  onNewChat,
  hasThread,
}: HeaderProps) {
  return (
    <header className="relative z-30 shrink-0 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1560px] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[17px] leading-none font-semibold tracking-tight">
                বুঝি নাই
              </h1>
              <Badge
                variant="outline"
                className="hidden border-emerald-300/25 bg-emerald-400/10 text-[10px] text-emerald-200 sm:inline-flex"
              >
                <span className="size-1.5 animate-soft-pulse rounded-full bg-emerald-300" />
                Gemma 4
              </Badge>
            </div>
            <p className="mt-1 truncate text-[11px] leading-none text-muted-foreground">
              IIUC স্টাডি কম্প্যানিয়ন · হোয়াইটবোর্ড → সহজ নোট
            </p>
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-1.5 lg:flex">
          <span className="mr-1 hidden text-[11px] text-muted-foreground/70 xl:inline">
            এক ক্লিকে দেখো
          </span>
          {SAMPLE_BOARDS.map((sample) => {
            const loading = sampleLoading === sample.search;

            return (
              <button
                key={sample.search}
                type="button"
                onClick={() => onSelectSample(sample.search)}
                disabled={sampleLoading !== null}
                className={cn(
                  "group flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-muted-foreground transition-all",
                  "hover:-translate-y-px hover:border-emerald-300/35 hover:bg-emerald-300/[0.08] hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:outline-none",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <span aria-hidden className="text-[13px]">
                  {sample.emoji}
                </span>
                <span className="font-medium text-foreground/85 group-hover:text-foreground">
                  {sample.department}
                </span>
                <span className="hidden text-muted-foreground lg:inline">
                  · {sample.title.split(" ")[0]}
                </span>
                {loading && <Loader2 className="size-3 animate-spin text-emerald-300" />}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenPanel}
            className="relative gap-1.5 border-white/10 bg-white/[0.03] text-xs lg:hidden"
          >
            <MessageSquareText className="size-3.5" />
            চ্যাট
            {chatCount > 0 && (
              <span className="grid min-w-4 place-items-center rounded-full bg-emerald-400/15 px-1 text-[10px] text-emerald-200">
                {chatCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            disabled={!hasThread}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            {hasThread ? <Plus className="size-3.5" /> : <RotateCcw className="size-3.5" />}
            <span className="hidden sm:inline">নতুন চ্যাট</span>
          </Button>
        </div>
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-3 lg:hidden">
        {SAMPLE_BOARDS.map((sample) => {
          const loading = sampleLoading === sample.search;

          return (
            <button
              key={sample.search}
              type="button"
              onClick={() => onSelectSample(sample.search)}
              disabled={sampleLoading !== null}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground transition-colors disabled:opacity-50"
            >
              <span aria-hidden>{sample.emoji}</span>
              <span className="font-medium text-foreground/85">{sample.department}</span>
              <span>· {sample.title.split(" ")[0]}</span>
              {loading && <Loader2 className="size-3 animate-spin text-emerald-300" />}
            </button>
          );
        })}
      </div>
    </header>
  );
}
