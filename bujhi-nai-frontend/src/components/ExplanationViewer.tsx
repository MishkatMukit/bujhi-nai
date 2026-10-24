"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Lightbulb,
  ListOrdered,
  Loader2,
  NotebookText,
  PenLine,
  Printer,
  Quote,
  Sparkles,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { MathMarkdown, toMarkdownMath } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DEPARTMENT_STYLES } from "@/lib/departments";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEPARTMENT_META, type BoardExplanation } from "@/types/board";

interface ExplanationViewerProps {
  board: BoardExplanation;
  onUpvote?: (board: BoardExplanation) => void;
  onPrint?: (board: BoardExplanation) => void;
  voted?: boolean;
  upvoting?: boolean;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export function ExplanationViewer({
  board,
  onUpvote,
  onPrint,
  voted = false,
  upvoting = false,
}: ExplanationViewerProps) {
  const [copied, setCopied] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(board.cleanTranscription);

    if (!ok) {
      toast.error("কপি করা গেল না — ব্রাউজার অনুমতি দেয়নি।");
      return;
    }

    setCopied(true);
    toast.success("পরিষ্কার Markdown কপি হয়েছে");
    window.setTimeout(() => setCopied(false), 1800);
  };

  const steps = [...(board.stepByStepBangla ?? [])].sort(
    (a, b) => a.stepNumber - b.stepNumber,
  );

  return (
    <article className="animate-rise overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {board.imageBase64 ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={board.imageBase64}
              alt={`${board.topicTitle} — বোর্ডের ছবি`}
              className="hidden size-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10 sm:block"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "h-5 border text-[10px] font-medium",
                  DEPARTMENT_STYLES[board.department].chip,
                )}
              >
                {DEPARTMENT_META[board.department].short}
              </Badge>
              {board.isSample && (
                <Badge
                  variant="outline"
                  className="h-5 border-amber-300/25 bg-amber-300/10 text-[10px] text-amber-200"
                >
                  স্যাম্পল
                </Badge>
              )}
              {board.hadAudioQuestion && (
                <span className="text-[10.5px] text-muted-foreground">🎙️ ভয়েস প্রশ্ন</span>
              )}
              {board.semester && (
                <span className="text-[10.5px] text-muted-foreground">{board.semester}</span>
              )}
            </div>

            <h3 className="mt-1.5 text-[17px] leading-snug font-semibold tracking-tight text-balance sm:text-lg">
              {board.topicTitle}
            </h3>
            <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {board.courseDetected}
            </p>
          </div>

          {onUpvote && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpvote(board)}
              disabled={voted || upvoting}
              aria-label={
                voted ? "ইতিমধ্যে কাজে লেগেছে জানানো হয়েছে" : "কাজে লেগেছে বলে ভোট দাও"
              }
              className={cn(
                "h-8 shrink-0 gap-1.5 rounded-full border-white/10 bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground",
                voted && "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
              )}
            >
              {upvoting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ThumbsUp className={cn("size-3.5", voted && "fill-current")} />
              )}
              <span className="tabular-nums">{formatCount(board.helpfulCount)}</span>
            </Button>
          )}
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-emerald-300/20 bg-linear-to-br from-emerald-400/[0.12] via-emerald-400/5 to-transparent p-3.5">
          <Quote className="absolute -top-2 -right-1 size-14 text-emerald-300/[0.08]" />
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-emerald-300 uppercase">
            <Sparkles className="size-3" />
            তোমার প্রশ্নের সরাসরি উত্তর
          </div>
          <MathMarkdown
            content={board.specificAnswer}
            className="mt-1.5 text-[13.5px] leading-relaxed text-emerald-50/90"
          />
        </div>

        <Tabs defaultValue="steps" className="mt-4">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="steps" className="gap-1.5 py-1.5 text-[11.5px]">
              <ListOrdered className="size-3.5" />
              <span className="hidden sm:inline">সহজ বাংলা ব্যাখ্যা</span>
              <span className="sm:hidden">ব্যাখ্যা</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 py-1.5 text-[11.5px]">
              <NotebookText className="size-3.5" />
              <span className="hidden sm:inline">পরিষ্কার নোট</span>
              <span className="sm:hidden">নোট</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-1.5 py-1.5 text-[11.5px]">
              <PenLine className="size-3.5" />
              <span className="hidden sm:inline">নিজে ট্রাই করো</span>
              <span className="sm:hidden">প্র্যাকটিস</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="mt-3 animate-rise">
            {steps.length > 0 ? (
              <ol className="space-y-2.5">
                {steps.map((step, index) => (
                  <li
                    key={`${step.stepNumber}-${index}`}
                    className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/15 p-3"
                  >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-200 tabular-nums">
                      {formatCount(step.stepNumber)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <MathMarkdown
                        content={toMarkdownMath(step.equationOrConcept)}
                        className="text-[13.5px] leading-relaxed font-medium text-emerald-50/95 [&_p]:my-0"
                      />
                      <MathMarkdown
                        content={step.banglaExplanation}
                        className="mt-1.5 text-[13px] leading-relaxed text-foreground/80"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl border border-white/[0.08] p-3 text-xs text-muted-foreground">
                এই বোর্ডের ধাপগুলো পাওয়া যায়নি।
              </p>
            )}

            {board.examShortcutTip && (
              <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-amber-200 uppercase">
                  <Zap className="size-3" />
                  পরীক্ষার শর্টকাট
                </div>
                <MathMarkdown
                  content={board.examShortcutTip}
                  className="mt-1.5 text-[13px] leading-relaxed text-amber-50/85"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-3 animate-rise">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-[10.5px] text-muted-foreground">
                বোর্ড + টপিকের পূর্ণাঙ্গ নোট (Markdown + LaTeX)
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                  className="h-7 gap-1.5 border-white/10 bg-white/[0.03] px-2 text-[11px]"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-300" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "কপি হয়েছে" : "Markdown কপি"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => (onPrint ? onPrint(board) : window.print())}
                  className="h-7 gap-1.5 border-white/10 bg-white/[0.03] px-2 text-[11px]"
                >
                  <Printer className="size-3" />
                  প্রিন্ট / PDF
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-3.5">
              <MathMarkdown content={board.cleanTranscription} />
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-3 animate-rise">
            <div className="rounded-2xl border border-white/10 bg-linear-to-br from-sky-400/[0.08] via-transparent to-transparent p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-sky-200 uppercase">
                <PenLine className="size-3" />
                প্র্যাকটিস প্রশ্ন
              </div>
              <MathMarkdown
                content={board.practiceProblem.question}
                className="mt-2 text-[13.5px] leading-relaxed"
              />
            </div>

            <div className="mt-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHintOpen((open) => !open)}
                aria-expanded={hintOpen}
                className="h-8 gap-1.5 rounded-full border-amber-300/20 bg-amber-300/5 px-3 text-[11px] text-amber-200 hover:bg-amber-300/10"
              >
                <Lightbulb className="size-3.5" />
                {hintOpen ? "হিন্ট লুকাও" : "হিন্ট দেখো"}
              </Button>

              {hintOpen && (
                <div className="animate-rise mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
                  <MathMarkdown
                    content={board.practiceProblem.hint}
                    className="text-[12.5px] leading-relaxed text-amber-50/85"
                  />
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="mt-3">
              <AccordionItem
                value="solution"
                className="rounded-2xl border border-white/10 bg-black/15 px-3.5"
              >
                <AccordionTrigger className="text-[12px] text-foreground/80 hover:no-underline">
                  নিজে লিখে ফেলো, তারপর সমাধান মিলাও
                </AccordionTrigger>
                <AccordionContent>
                  <MathMarkdown
                    content={board.practiceProblem.solution}
                    className="text-[12.5px] leading-relaxed"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </article>
  );
}
