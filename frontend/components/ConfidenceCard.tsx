"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { cn, getConfidenceColor } from "@/lib/utils";

interface ConfidenceCardProps {
  confidence: number;
  className?: string;
}

export function ConfidenceCard({ confidence, className }: ConfidenceCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = confidence / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= confidence) {
        setDisplayValue(confidence);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [confidence]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (displayValue / 100) * circumference;

  const colorClass = getConfidenceColor(confidence);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Confidence Score
        </p>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-36 w-36">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 128 128"
          >
            {/* Background ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/50"
            />
            {/* Progress ring */}
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={cn(
                confidence >= 90
                  ? "text-emerald-500"
                  : confidence >= 70
                  ? "text-yellow-500"
                  : "text-red-500"
              )}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", colorClass)}>
              {displayValue.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              percent
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {confidence >= 90
          ? "High confidence prediction"
          : confidence >= 70
          ? "Moderate confidence — consider further review"
          : "Low confidence — additional testing recommended"}
      </p>
    </motion.div>
  );
}
