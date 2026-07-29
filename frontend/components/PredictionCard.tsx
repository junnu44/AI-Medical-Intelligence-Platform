"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Stethoscope } from "lucide-react";
import { cn, getPredictionColor } from "@/lib/utils";

interface PredictionCardProps {
  prediction: string;
  className?: string;
}

export function PredictionCard({ prediction, className }: PredictionCardProps) {
  const colors = getPredictionColor(prediction);
  const isNormal = prediction === "NORMAL";
  const Icon = isNormal ? ShieldCheck : ShieldAlert;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      className={cn(
        "rounded-2xl border p-6",
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
            isNormal
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-red-100 dark:bg-red-900/30"
          )}
        >
          <Icon
            className={cn(
              "h-7 w-7",
              isNormal
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            AI Prediction
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h3 className={cn("text-2xl font-bold", colors.text)}>
              {prediction}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                colors.bg,
                colors.text,
                "ring-1",
                colors.ring
              )}
            >
              <Stethoscope className="h-3 w-3" />
              {isNormal ? "Healthy" : "Detected"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
