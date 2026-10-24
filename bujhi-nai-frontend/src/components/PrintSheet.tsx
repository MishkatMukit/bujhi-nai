"use client";

import { useEffect } from "react";
import { MathMarkdown } from "@/components/Markdown";
import { DEPARTMENT_META, type BoardExplanation } from "@/types/board";

interface PrintSheetProps {
  board: BoardExplanation;
  /** Stable callback that clears the sheet after the print dialog closes. */
  onDone: () => void;
}

/**
 * Body-level printable copy of one board's notes.
 *
 * The app shell is a fixed-height, overflow-hidden chat UI, so printing the
 * in-place notes card clips everything below the fold. This sheet lives
 * outside the shell, is hidden on screen, and replaces it under `@media print`.
 */
export function PrintSheet({ board, onDone }: PrintSheetProps) {
  useEffect(() => {
    let active = true;
    const handleAfterPrint = () => onDone();
    window.addEventListener("afterprint", handleAfterPrint);

    // Let KaTeX/fonts paint before opening the dialog; the state update that
    // mounted this sheet has not been committed when the click handler runs.
    const timer = window.setTimeout(() => {
      const openDialog = () => {
        if (active) {
          window.print();
        }
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(openDialog, openDialog);
      } else {
        openDialog();
      }
    }, 80);

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [board._id, onDone]);

  return (
    <div className="print-root" aria-hidden>
      <header className="print-root-header">
        <p className="print-root-brand">বুঝি নাই · IIUC স্টাডি কম্প্যানিয়ন</p>
        <h1>{board.topicTitle}</h1>
        <p className="print-root-meta">
          {DEPARTMENT_META[board.department].short}
          {board.courseDetected ? ` · ${board.courseDetected}` : ""}
          {board.semester ? ` · ${board.semester}` : ""}
        </p>
      </header>

      <MathMarkdown content={board.cleanTranscription} className="print-root-notes" />

      <footer className="print-root-footer">
        বুঝি নাই-তে তৈরি · গুরুত্বপূর্ণ ধাপ নিজে যাচাই করে নাও
      </footer>
    </div>
  );
}
