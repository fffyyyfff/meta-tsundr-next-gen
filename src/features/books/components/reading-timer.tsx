"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PlayIcon, PauseIcon, ClockIcon, TimerIcon } from "lucide-react";

interface ReadingSession {
  startTime: number;
  duration: number;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getSessions(bookId: string): ReadingSession[] {
  try {
    const stored = localStorage.getItem(`reading-sessions-${bookId}`);
    return stored ? (JSON.parse(stored) as ReadingSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(bookId: string, sessions: ReadingSession[]) {
  localStorage.setItem(
    `reading-sessions-${bookId}`,
    JSON.stringify(sessions),
  );
}

function getTotalSeconds(sessions: ReadingSession[]): number {
  return sessions.reduce((sum, s) => sum + s.duration, 0);
}

interface ReadingTimerProps {
  bookId: string;
}

export function ReadingTimer({ bookId }: ReadingTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load total time on mount
  useEffect(() => {
    const sessions = getSessions(bookId);
    setTotalTime(getTotalSeconds(sessions));
  }, [bookId]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(
          Math.floor((Date.now() - startTimeRef.current) / 1000),
        );
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = Math.floor(
      (Date.now() - startTimeRef.current) / 1000,
    );
    if (duration > 0) {
      const sessions = getSessions(bookId);
      sessions.push({ startTime: startTimeRef.current, duration });
      saveSessions(bookId, sessions);
      setTotalTime(getTotalSeconds(sessions));
    }
    setElapsed(0);
  }, [bookId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TimerIcon className="size-4" />
          読書タイマー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current session */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="font-mono text-3xl font-bold tabular-nums">
              {formatTime(elapsed)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isRunning ? "読書中..." : "セッション"}
            </p>
          </div>
          <Button
            size="lg"
            variant={isRunning ? "destructive" : "default"}
            onClick={isRunning ? handleStop : handleStart}
            className="size-14 rounded-full p-0"
          >
            {isRunning ? (
              <PauseIcon className="size-6" />
            ) : (
              <PlayIcon className="size-6 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Cumulative time */}
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <ClockIcon className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            累計読書時間:
          </span>
          <span className="font-mono text-sm font-medium">
            {formatTime(totalTime + (isRunning ? elapsed : 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function getAllReadingSessions(): Record<string, ReadingSession[]> {
  const result: Record<string, ReadingSession[]> = {};
  if (typeof window === "undefined") return result;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("reading-sessions-")) {
      const bookId = key.replace("reading-sessions-", "");
      result[bookId] = getSessions(bookId);
    }
  }
  return result;
}

export function getReadingTimeStats() {
  const allSessions = getAllReadingSessions();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = todayStart - new Date().getDay() * 86400000;
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).getTime();

  let todaySeconds = 0;
  let weekSeconds = 0;
  let monthSeconds = 0;
  let totalSeconds = 0;

  for (const sessions of Object.values(allSessions)) {
    for (const s of sessions) {
      totalSeconds += s.duration;
      if (s.startTime >= todayStart) todaySeconds += s.duration;
      if (s.startTime >= weekStart) weekSeconds += s.duration;
      if (s.startTime >= monthStart) monthSeconds += s.duration;
    }
  }

  return { todaySeconds, weekSeconds, monthSeconds, totalSeconds };
}
