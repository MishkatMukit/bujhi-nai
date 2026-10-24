import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

const LATEX_COMMAND = /\\[a-zA-Z]+/;

/**
 * `equationOrConcept` usually arrives as bare text or bare LaTeX
 * (e.g. `V_{th} = V_{oc}`) while notes arrive with `$...$` already in place.
 * Only wrap strings that are unambiguously math: set notation such as
 * `P_1 = {q0, q2}` breaks inside math mode, and concept labels like
 * `P_0: final vs non-final` read worse as italic KaTeX.
 */
export const toMarkdownMath = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed || trimmed.includes("$") || trimmed.includes("\\(") || trimmed.includes("\\[")) {
    return trimmed;
  }

  const hasBraces = trimmed.includes("{") || trimmed.includes("}");
  const hasLatexCommand = LATEX_COMMAND.test(trimmed);

  if (hasBraces && !hasLatexCommand) {
    return trimmed;
  }

  const looksLikeMath =
    hasLatexCommand ||
    trimmed.includes("^") ||
    trimmed.includes("_{") ||
    /=\s*[A-Za-z0-9]/.test(trimmed);

  return looksLikeMath ? `$${trimmed}$` : trimmed;
};

interface MathMarkdownProps {
  content: string;
  className?: string;
}

/** Markdown + KaTeX renderer. Raw HTML stays escaped by react-markdown. */
export function MathMarkdown({ content, className }: MathMarkdownProps) {
  return (
    <div className={cn("note-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
