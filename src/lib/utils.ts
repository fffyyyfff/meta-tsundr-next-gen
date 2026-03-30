import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainMin = minutes % 60
    return remainMin > 0 ? `${hours}時間${remainMin}分` : `${hours}時間`
  }
  if (minutes > 0) {
    const remainSec = seconds % 60
    return remainSec > 0 ? `${minutes}分${remainSec}秒` : `${minutes}分`
  }
  return `${seconds}秒`
}
