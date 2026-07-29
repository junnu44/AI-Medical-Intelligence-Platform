"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            {title}
          </h3>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3.5 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ConnectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
        <WifiOff className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Backend Unreachable
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Unable to connect to the server. Please ensure the FastAPI backend is
          running on the configured port.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      )}
    </motion.div>
  );
}
