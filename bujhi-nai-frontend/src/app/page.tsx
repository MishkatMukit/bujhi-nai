"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BoardUploader } from "@/components/BoardUploader";
import { CampusSidePanel } from "@/components/CampusSidePanel";
import { ChatThread } from "@/components/ChatThread";
import { Header } from "@/components/Header";
import { PrintSheet } from "@/components/PrintSheet";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import {
  explainBoard,
  getBanglaErrorMessage,
  listBoards,
  upvoteBoard,
} from "@/lib/api";
import type { BoardExplanation, Department } from "@/types/board";
import type { ThreadItem } from "@/types/chat";

const makeId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function Home() {
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [archive, setArchive] = useState<BoardExplanation[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveVersion, setArchiveVersion] = useState(0);
  const [department, setDepartment] = useState<Department | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set());
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [printBoard, setPrintBoard] = useState<BoardExplanation | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const submissionsRef = useRef<Map<string, FormData>>(new Map());
  const objectUrlsRef = useRef<string[]>([]);
  const activeRequestsRef = useRef(0);
  const archiveRequestRef = useRef(0);

  const beginRequest = useCallback(() => {
    activeRequestsRef.current += 1;
    setSending(true);
  }, []);

  const endRequest = useCallback(() => {
    activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);

    if (activeRequestsRef.current === 0) {
      setSending(false);
    }
  }, []);

  const revokeObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrls();
    };
  }, [revokeObjectUrls]);

  // Debounce the archive search so typing does not hit the API on every key.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const requestId = ++archiveRequestRef.current;

    setArchiveLoading(true);
    setArchiveError(null);

    // No AbortController here: aborting in-flight fetches makes Next's patched
    // fetch leak AbortError rejections. Stale responses are ignored by id.
    let cancelled = false;

    const load = async () => {
      try {
        const boards = await listBoards({
          department,
          search: debouncedSearch,
        });

        if (!cancelled && requestId === archiveRequestRef.current) {
          setArchive(boards);
        }
      } catch (error) {
        if (!cancelled && requestId === archiveRequestRef.current) {
          setArchiveError(getBanglaErrorMessage(error));
        }
      } finally {
        if (!cancelled && requestId === archiveRequestRef.current) {
          setArchiveLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [department, debouncedSearch, archiveVersion]);

  const lastItem = thread.at(-1);
  const lastItemKey = lastItem
    ? `${lastItem.id}:${lastItem.role === "assistant" ? lastItem.status : "user"}`
    : "empty";
  const lastReadyId =
    lastItem?.role === "assistant" && lastItem.status === "ready"
      ? lastItem.id
      : null;
  const lastReadyScrolledRef = useRef<string | null>(null);

  useEffect(() => {
    if (thread.length === 0) {
      lastReadyScrolledRef.current = null;
      return;
    }

    if (lastReadyId) {
      // Only jump when a reply actually turns ready, not on upvotes/re-renders.
      if (lastReadyScrolledRef.current !== lastReadyId) {
        lastReadyScrolledRef.current = lastReadyId;
        document
          .querySelector(`[data-message-id="${lastReadyId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, lastItemKey, lastReadyId]);


  const refreshArchive = () => setArchiveVersion((version) => version + 1);

  const patchHelpfulCount = (boardId: string, helpfulCount: number) => {
    setArchive((boards) =>
      boards.map((board) =>
        board._id === boardId ? { ...board, helpfulCount } : board,
      ),
    );
    setThread((items) =>
      items.map((item) => {
        if (item.role !== "assistant" || item.board?._id !== boardId) {
          return item;
        }

        return { ...item, board: { ...item.board, helpfulCount } };
      }),
    );
  };

  const runExplanation = useCallback(
    async (id: string, formData: FormData) => {
      beginRequest();

      try {
        const board = await explainBoard(formData);

        setThread((items) =>
          items.map((item) =>
            item.id === id && item.role === "assistant"
              ? { ...item, status: "ready", board, error: undefined }
              : item,
          ),
        );
        setArchive((boards) => [
          board,
          ...boards.filter((existing) => existing._id !== board._id),
        ]);
        submissionsRef.current.delete(id);
        refreshArchive();
      } catch (error) {
        setThread((items) =>
          items.map((item) =>
            item.id === id && item.role === "assistant"
              ? { ...item, status: "error", error: getBanglaErrorMessage(error) }
              : item,
          ),
        );
      } finally {
        endRequest();
      }
    },
    [beginRequest, endRequest],
  );

  const handleSubmit = async (formData: FormData) => {
    const image = formData.get("image");
    const question = String(formData.get("textQuestion") ?? "").trim();
    const rawDepartment = formData.get("department");
    const value: Department =
      typeof rawDepartment === "string" ? (rawDepartment as Department) : "General";
    const hadAudio = formData.get("audio") instanceof File;
    const id = makeId();

    submissionsRef.current.set(id, formData);

    let imageUrl: string | undefined;

    if (image instanceof File) {
      imageUrl = URL.createObjectURL(image);
      objectUrlsRef.current.push(imageUrl);
    }

    setThread((items) => [
      ...items,
      {
        id: `${id}-question`,
        role: "user",
        question,
        department: value,
        imageUrl,
        hadAudio,
      },
      { id, role: "assistant", status: "pending" },
    ]);
    setArchiveOpen(false);

    await runExplanation(id, formData);
  };

  const handleRetry = (id: string) => {
    const formData = submissionsRef.current.get(id);

    if (!formData) {
      toast.error("আগের ছবিটা পাওয়া যাচ্ছে না — আবার ছবি দিয়ে চেষ্টা করো।");
      return;
    }

    setThread((items) =>
      items.map((item) =>
        item.id === id && item.role === "assistant"
          ? { ...item, status: "pending", error: undefined }
          : item,
      ),
    );
    void runExplanation(id, formData);
  };

  /**
   * The rail lists saved board explanations as chats, so opening one replaces
   * the thread with that single Q&A exchange instead of appending to it.
   */
  const openBoardChat = (board: BoardExplanation) => {
    submissionsRef.current.clear();
    revokeObjectUrls();

    setThread([
      {
        id: `${board._id}-question`,
        role: "user",
        question:
          board.studentQuestion?.trim() || `${board.topicTitle} — এটা বুঝিয়ে দাও`,
        department: board.department,
        hadAudio: board.hadAudioQuestion,
      },
      { id: `${board._id}-answer`, role: "assistant", status: "ready", board },
    ]);
    setActiveChatId(board._id);
    setArchiveOpen(false);
  };

  const handleSelectSample = async (term: string) => {
    if (sampleLoading) {
      return;
    }

    setSampleLoading(term);

    try {
      const boards = await listBoards({ search: term });
      const board = boards.find((result) => result.isSample) ?? boards[0];

      if (!board) {
        toast.error("স্যাম্পল বোর্ডটা পাওয়া গেল না — আর্কাইভ থেকে দেখে নাও।");
        return;
      }

      openBoardChat(board);
    } catch (error) {
      toast.error(getBanglaErrorMessage(error));
    } finally {
      setSampleLoading(null);
    }
  };

  const handleUpvote = async (board: BoardExplanation) => {
    if (votedIds.has(board._id) || upvotingId) {
      return;
    }

    const previousCount = board.helpfulCount;

    setUpvotingId(board._id);
    setVotedIds((ids) => new Set(ids).add(board._id));
    patchHelpfulCount(board._id, previousCount + 1);

    try {
      const result = await upvoteBoard(board._id);
      patchHelpfulCount(board._id, result.helpfulCount);
      toast.success("ধন্যবাদ! ক্লাসমেটদের কাজে লাগবে।");
    } catch (error) {
      patchHelpfulCount(board._id, previousCount);
      setVotedIds((ids) => {
        const next = new Set(ids);
        next.delete(board._id);
        return next;
      });
      toast.error(getBanglaErrorMessage(error));
    } finally {
      setUpvotingId(null);
    }
  };

  const clearPrint = useCallback(() => setPrintBoard(null), []);

  const handleNewChat = () => {
    submissionsRef.current.clear();
    revokeObjectUrls();
    setThread([]);
    setActiveChatId(null);
    setPrintBoard(null);
  };

  const archiveProps = {
    boards: archive,
    loading: archiveLoading,
    error: archiveError,
    onRetry: refreshArchive,
    department,
    search,
    onDepartmentChange: setDepartment,
    onSearchChange: setSearch,
    onSelect: openBoardChat,
    activeChatId,
    onUpvote: (board: BoardExplanation) => void handleUpvote(board),
    votedIds,
    upvotingId,
  };

  return (
    <>
      <div className="app-shell flex h-dvh flex-col overflow-hidden">
        <Header
          onSelectSample={(term) => void handleSelectSample(term)}
          sampleLoading={sampleLoading}
          onOpenPanel={() => setArchiveOpen(true)}
          chatCount={archive.length}
          onNewChat={handleNewChat}
          hasThread={thread.length > 0}
        />

        <div className="flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col">
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pt-5 pb-2 sm:px-6">
                <ChatThread
                  items={thread}
                  sampleLoading={sampleLoading}
                  onSelectSample={(term) => void handleSelectSample(term)}
                  onOpenPanel={() => setArchiveOpen(true)}
                  chatCount={archive.length}
                  onUpvote={(board) => void handleUpvote(board)}
                  onPrint={setPrintBoard}
                  votedIds={votedIds}
                  upvotingId={upvotingId}
                  onRetry={handleRetry}
                />
                <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
              </div>
            </div>

            <div className="relative z-10 shrink-0 bg-linear-to-t from-background via-background/95 to-transparent px-3 pt-1 pb-3 sm:px-6 sm:pb-4">
              <div className="mx-auto w-full max-w-3xl">
                <BoardUploader onSubmit={handleSubmit} busy={sending} />
                <p className="mt-1.5 hidden text-center text-[9.5px] text-muted-foreground/45 sm:block">
                  AI ভুল করতে পারে — গুরুত্বপূর্ণ স্টেপ নিজে যাচাই করে নাও।
                </p>
              </div>
            </div>
          </main>

          <aside className="hidden w-[360px] shrink-0 border-l border-white/5 bg-black/20 lg:block xl:w-[400px]">
            <CampusSidePanel {...archiveProps} />
          </aside>
        </div>

        <Sheet open={archiveOpen} onOpenChange={setArchiveOpen}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full gap-0 border-white/10 bg-background p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          >
            <SheetTitle className="sr-only">চ্যাট আর ক্যাম্পাস আর্কাইভ</SheetTitle>
            <SheetDescription className="sr-only">
              আগের চ্যাট খুলে নাও, বা ডিপার্টমেন্ট আর সার্চ দিয়ে বোর্ড এক্সপ্লেনেশন খুঁজে নাও।
            </SheetDescription>
            <CampusSidePanel
              {...archiveProps}
              onClose={() => setArchiveOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Toaster position="top-center" theme="dark" />
      </div>

      {printBoard && <PrintSheet board={printBoard} onDone={clearPrint} />}
    </>
  );
}
