"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  message,
  size = "md",
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <div className="relative">
        <Loader2
          className={cn(
            "animate-spin text-blue-600 dark:text-blue-400",
            sizeMap[size]
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-blue-500/20 animate-pulse-ring",
            sizeMap[size]
          )}
        />
      </div>
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </motion.div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <div className="space-y-4">
        <div className="h-4 w-1/3 rounded-lg bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        <div className="h-3 w-full rounded-lg bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        <div className="h-3 w-4/5 rounded-lg bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        <div className="h-32 w-full rounded-xl bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border/30 bg-card p-4"
        >
          <div className="h-4 w-8 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          <div className="h-4 w-24 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          <div className="h-4 w-20 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          <div className="flex-1" />
          <div className="h-4 w-16 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        </div>
      ))}
    </div>
  );
}
