import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-green-600 dark:text-green-400";
  if (confidence >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function getConfidenceBgColor(confidence: number): string {
  if (confidence >= 90) return "bg-green-100 dark:bg-green-900/30";
  if (confidence >= 70) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

export function getPredictionColor(prediction: string): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (prediction === "NORMAL") {
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      ring: "ring-emerald-500/20",
    };
  }
  return {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    ring: "ring-red-500/20",
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getApiUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${baseUrl}${path}`;
}
