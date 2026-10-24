"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  Camera,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VoiceRecorder, type RecordedAudio } from "@/components/VoiceRecorder";
import { fileSizeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, DEPARTMENT_META, type Department } from "@/types/board";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface BoardUploaderProps {
  onSubmit: (formData: FormData) => void | Promise<void>;
  busy: boolean;
}

const audioFileFrom = (audio: RecordedAudio): File => {
  const mimeType = audio.mimeType.split(";")[0];
  const extension =
    mimeType === "audio/webm"
      ? "webm"
      : mimeType === "audio/mp4"
        ? "m4a"
        : mimeType === "audio/ogg"
          ? "ogg"
          : mimeType === "audio/wav"
            ? "wav"
            : "mp3";

  return new File([audio.blob], `voice-question.${extension}`, { type: mimeType });
};

export function BoardUploader({ onSubmit, busy }: BoardUploaderProps) {
  const [department, setDepartment] = useState<Department>("CSE");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [recorderKey, setRecorderKey] = useState(0);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const dragDepthRef = useRef(0);

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  };

  const removeImage = () => {
    clearPreview();
    setImageFile(null);

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const acceptFile = (file: File) => {
    if (busy) {
      return;
    }

    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("JPG, PNG বা WebP ছবি দাও। স্ক্রিনশট হলেও চলবে।");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("ছবিটা ৫ MB-এর মধ্যে হতে হবে। একটু ছোট করে নাও।");
      return;
    }

    clearPreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setImageFile(file);
  };

  const resetComposer = () => {
    removeImage();
    setText("");
    setAudio(null);
    setError(null);
    setRecorderKey((key) => key + 1);
  };

  const handleSubmit = async () => {
    if (busy) {
      return;
    }

    if (!imageFile) {
      setError("আগে বোর্ডের একটা ছবি দাও — তারপর বুঝিয়ে দেবো।");
      galleryInputRef.current?.click();
      return;
    }

    if (audio && audio.blob.size > MAX_IMAGE_BYTES) {
      setError("ভয়েস ক্লিপটা অনেক বড় — ১৫ সেকেন্ডের মধ্যে আবার রেকর্ড করো।");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("department", department);

    const trimmedQuestion = text.trim();

    if (trimmedQuestion) {
      formData.append("textQuestion", trimmedQuestion);
    }

    if (audio) {
      formData.append("audio", audioFileFrom(audio));
    }

    resetComposer();
    await onSubmit(formData);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [text]);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);

    if (busy) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      acceptFile(file);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_22px_70px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-colors",
        "focus-within:border-emerald-300/30 focus-within:bg-white/[0.055]",
        dragging && "border-emerald-300/50",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
          setDragging(false);
        }
      }}
      onDrop={onDrop}
      onPaste={(event) => {
        const item = Array.from(event.clipboardData.items).find((entry) =>
          entry.type.startsWith("image/"),
        );
        const file = item?.getAsFile();

        if (file) {
          event.preventDefault();
          acceptFile(file);
        }
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-[inherit] border-2 border-dashed border-emerald-300/60 bg-emerald-950/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <ImagePlus className="size-7 text-emerald-300" />
            <p className="text-sm font-medium text-emerald-100">ছবিটা এখানে ছেড়ে দাও</p>
            <p className="text-[11px] text-emerald-200/60">থামলে সাথে সাথে ব্যাখ্যা শুরু হবে</p>
          </div>
        </div>
      )}

      {imageFile && previewUrl && (
        <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-2 pr-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="নির্বাচিত বোর্ডের ছবি"
            className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground/90">{imageFile.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {fileSizeLabel(imageFile.size)} · {DEPARTMENT_META[department].short}
            </p>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="mt-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              অন্য ছবি নাও
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={removeImage}
            disabled={busy}
            aria-label="ছবিটা মুছে ফেলো"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
          }
        }}
        disabled={busy}
        aria-label="কোথায় আটকে গেছো — প্রশ্ন লিখো"
        placeholder="কোথায় আটকে গেছো? (ঐচ্ছিক) — যেমন: ৩ নম্বর স্টেপে লুপের Time Complexity কিভাবে আসলো?"
        rows={1}
        className="max-h-40 min-h-0 resize-none border-0 bg-transparent px-1 py-2 text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/65 focus-visible:border-transparent focus-visible:ring-0 disabled:opacity-60"
      />

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => galleryInputRef.current?.click()}
                disabled={busy}
                aria-label="ছবি যোগ করো"
                className="size-9 rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              >
                <ImagePlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ছবি যোগ করো</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => cameraInputRef.current?.click()}
                disabled={busy}
                aria-label="ক্যামেরা দিয়ে তুলো"
                className="size-9 rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:hidden"
              >
                <Camera className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ক্যামেরা দিয়ে তুলো</TooltipContent>
          </Tooltip>

          <VoiceRecorder key={recorderKey} onChange={setAudio} disabled={busy} />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Select
            value={department}
            onValueChange={(value) => setDepartment(value as Department)}
            disabled={busy}
          >
            <SelectTrigger
              size="sm"
              aria-label="বিভাগ বাছাই করো"
              className="h-9 gap-1.5 border-white/10 bg-white/[0.03] px-2.5 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((value) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {DEPARTMENT_META[value].short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="lg"
            onClick={() => void handleSubmit()}
            disabled={busy}
            className={cn(
              "h-9 gap-1.5 rounded-full bg-emerald-400 px-3 text-emerald-950 shadow-[0_0_28px_-10px_oklch(0.79_0.155_162/0.9)] hover:bg-emerald-300",
              !imageFile && "bg-white/10 text-foreground/60 shadow-none hover:bg-white/15",
            )}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : imageFile ? (
              <Sparkles className="size-4" />
            ) : (
              <ArrowUp className="size-4" />
            )}
            <span className="text-xs font-semibold">
              {busy ? "বুঝছি…" : "বুঝিয়ে দাও"}
            </span>
          </Button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p className="text-[10.5px] leading-relaxed text-muted-foreground/70">
          ছবি + ভয়েস একসাথে দিতে পারো · সর্বোচ্চ ৫ MB
        </p>
        <p className="hidden items-center gap-1 text-[10.5px] text-muted-foreground/60 sm:flex">
          <span className="rounded border border-white/10 px-1 font-mono text-[9px]">Enter</span>
          দিয়ে পাঠাও
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 px-1 text-[11px] leading-relaxed text-red-300"
        >
          <AlertCircle className="mt-0.5 size-3 shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (file) {
            acceptFile(file);
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (file) {
            acceptFile(file);
          }
        }}
      />
    </div>
  );
}
