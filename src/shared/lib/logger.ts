type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = process.env.NODE_ENV !== "production";
const minLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? "info"] ?? 1;

function formatEntry(entry: LogEntry): string {
  if (isDev) {
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${entry.level.toUpperCase()}] ${entry.service}: ${entry.message}${ctx}`;
  }
  return JSON.stringify(entry);
}

function log(
  service: string,
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  if (LOG_LEVELS[level] < minLevel) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(context && { context }),
  };

  const output = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.info(output);
  }
}

interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(service: string): Logger {
  return {
    debug: (msg, ctx) => log(service, "debug", msg, ctx),
    info: (msg, ctx) => log(service, "info", msg, ctx),
    warn: (msg, ctx) => log(service, "warn", msg, ctx),
    error: (msg, ctx) => log(service, "error", msg, ctx),
  };
}

export const logger = createLogger("app");
