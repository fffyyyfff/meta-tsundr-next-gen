"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { trpcReact } from "@/shared/lib/trpc-provider";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import Image from "next/image";
import {
  MicIcon,
  MicOffIcon,
  Loader2Icon,
  CheckCircleIcon,
} from "lucide-react";

type ItemCategory =
  | "BOOK"
  | "ELECTRONICS"
  | "DAILY_GOODS"
  | "FOOD"
  | "CLOTHING"
  | "HOBBY"
  | "OTHER";

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    BOOK: "書籍",
    ELECTRONICS: "家電",
    DAILY_GOODS: "日用品",
    FOOD: "食品",
    CLOTHING: "衣類",
    HOBBY: "趣味",
    OTHER: "その他",
  };
  return labels[cat] ?? cat;
}

function formatPrice(price: number | null): string {
  if (price == null) return "";
  return `¥${price.toLocaleString("ja-JP")}`;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionInstance)
    | null;
}

interface VoiceInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceInput({ open, onOpenChange }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [registered, setRegistered] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const utils = trpcReact.useUtils();

  const voiceMutation = trpcReact.item.voiceRegister.useMutation();
  const createMutation = trpcReact.item.create.useMutation({
    onSuccess: () => {
      setRegistered(true);
      utils.item.list.invalidate();
    },
  });

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      // Auto-analyze
      voiceMutation.mutate({ transcript: text });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    setRegistered(false);
    voiceMutation.reset();
  }, [voiceMutation]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleRegister = useCallback(() => {
    const data = voiceMutation.data;
    if (!data || data.error) return;

    createMutation.mutate({
      title: data.title,
      category: data.category as ItemCategory,
      price: data.price ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      source: data.source ?? undefined,
      status: "WISHLIST",
    });
  }, [voiceMutation.data, createMutation]);

  const handleClose = useCallback(() => {
    stopListening();
    setTranscript("");
    setRegistered(false);
    voiceMutation.reset();
    onOpenChange(false);
  }, [stopListening, voiceMutation, onOpenChange]);

  const result = voiceMutation.data;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>音声で登録</DialogTitle>
          <DialogDescription>
            「リーダブルコード追加して」のように話しかけてください
          </DialogDescription>
        </DialogHeader>

        {!supported ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            お使いのブラウザは音声入力に対応していません
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={voiceMutation.isPending || createMutation.isPending}
              className={`relative flex size-20 items-center justify-center rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {isListening && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
              )}
              {isListening ? (
                <MicOffIcon className="relative size-8" />
              ) : (
                <MicIcon className="size-8" />
              )}
            </button>

            <p className="text-sm text-muted-foreground">
              {isListening
                ? "聞いています..."
                : transcript
                  ? ""
                  : "マイクをタップして話す"}
            </p>

            {/* Transcript */}
            {transcript && (
              <div className="w-full rounded-md bg-muted/50 px-4 py-2">
                <p className="text-center text-sm">
                  「{transcript}」
                </p>
              </div>
            )}

            {/* Loading */}
            {voiceMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                AI解析中...
              </div>
            )}

            {/* Result preview */}
            {result && !result.error && !registered && (
              <div className="w-full space-y-3 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  {result.imageUrl ? (
                    <Image
                      src={result.imageUrl}
                      alt={result.title}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                      style={{ width: 64, height: 64 }}
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-md bg-muted text-2xl">
                      📦
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {getCategoryLabel(result.category)}
                      </span>
                      {result.price != null && (
                        <span className="text-sm font-medium text-[var(--page-accent)]">
                          {formatPrice(result.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result?.error && (
              <p className="text-sm text-destructive">{result.error}</p>
            )}

            {/* Registered */}
            {registered && (
              <p className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="size-4" />
                登録しました
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {result && !result.error && !registered && (
            <Button
              onClick={handleRegister}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-1 size-4 animate-spin" />
                  登録中...
                </>
              ) : (
                "登録する"
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            {registered ? "閉じる" : "キャンセル"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
