"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RecordedAudio {
  blob: Blob;
  mimeType: string;
  seconds: number;
}

interface VoiceRecorderProps {
  onChange: (audio: RecordedAudio | null) => void;
  disabled?: boolean;
}

type Status = "idle" | "requesting" | "recording" | "ready";

const MAX_SECONDS = 15;

/** MediaRecorder can fall back across browsers; keep the base type for upload. */
const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const formatSeconds = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceRecorder({ onChange, disabled }: VoiceRecorderProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const secondsRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  }, []);

  const startRecording = async () => {
    setError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("এই ব্রাউজারে ভয়েস রেকর্ডিং সাপোর্ট করছে না — টেক্সটে লিখে দাও।");
      return;
    }

    clearPreview();
    setStatus("requesting");
    onChange(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = pickMimeType();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      const session = ++sessionRef.current;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        stopStream();

        if (session !== sessionRef.current) {
          return;
        }

        const baseMime = (recorder.mimeType || preferredMime || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type: baseMime });

        if (blob.size === 0) {
          setStatus("idle");
          setError("রেকর্ডিংটা খালি এসেছে — আবার চেষ্টা করো।");
          onChange(null);
          return;
        }

        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setStatus("ready");
        onChange({ blob, mimeType: baseMime, seconds: secondsRef.current });
      };

      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      setSeconds(0);
      secondsRef.current = 0;
      startedAtRef.current = Date.now();

      stopTimer();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const clamped = Math.min(elapsed, MAX_SECONDS);
        secondsRef.current = clamped;
        setSeconds(clamped);

        if (clamped >= MAX_SECONDS) {
          stopTimer();

          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 250);
    } catch (cause) {
      stopTimer();
      stopStream();
      setStatus("idle");
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "মাইকের অনুমতি পাওয়া যায়নি — ব্রাউজারের সেটিংস থেকে অনুমতি দাও।"
          : "মাইক চালু করা যাচ্ছে না। আবার চেষ্টা করো বা টেক্সটে লিখে দাও।",
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const reset = () => {
    // Invalidates the in-flight `onstop` handler before stopping the recorder.
    sessionRef.current += 1;
    stopTimer();

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    recorderRef.current = null;
    stopStream();
    clearPreview();
    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    setStatus("idle");
    setError(null);
    onChange(null);
  };

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      stopTimer();

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      stopStream();
      clearPreview();
    };
  }, [clearPreview, stopStream, stopTimer]);

  return (
    <div className="min-w-0">
      {status === "idle" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          disabled={disabled}
          className="h-9 gap-1.5 border-white/10 bg-white/[0.03] px-2.5 text-xs text-muted-foreground hover:border-emerald-300/30 hover:bg-emerald-300/[0.08] hover:text-foreground"
        >
          <Mic className="size-3.5 text-emerald-300" />
          <span className="hidden sm:inline">ভয়েস</span>
        </Button>
      )}

      {status === "requesting" && (
        <div className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-emerald-300" />
          <span className="hidden sm:inline">অনুমতি…</span>
        </div>
      )}

      {status === "recording" && (
        <div className="flex h-9 items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 pl-2.5">
          <span className="size-2 animate-pulse rounded-full bg-red-400" />
          <span
            className="font-mono text-[11px] tabular-nums text-red-200"
            aria-live="polite"
          >
            {formatSeconds(seconds)} / {formatSeconds(MAX_SECONDS)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={stopRecording}
            aria-label="রেকর্ডিং থামাও"
            className="text-red-200 hover:bg-red-400/20 hover:text-red-100"
          >
            <Square className="size-3 fill-current" />
          </Button>
        </div>
      )}

      {status === "ready" && previewUrl && (
        <div className="flex h-9 items-center gap-1 rounded-lg border border-emerald-300/25 bg-emerald-400/10 py-0.5 pr-1 pl-2">
          <Check className="size-3 shrink-0 text-emerald-300" />
          <audio
            src={previewUrl}
            controls
            preload="metadata"
            className="h-7 w-36 max-w-[46vw]"
          >
            <track kind="captions" />
          </audio>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={reset}
            aria-label="ভয়েসটা মুছে ফেলো"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className={cn("mt-2 max-w-64 text-[11px] leading-relaxed text-red-300")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
