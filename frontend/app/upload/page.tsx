"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { PatientForm } from "@/components/PatientForm";
import { PredictionCard } from "@/components/PredictionCard";
import { ConfidenceCard } from "@/components/ConfidenceCard";
import { GradCAMViewer } from "@/components/GradCAMViewer";
import { MedicalReport } from "@/components/MedicalReport";
import { getGeneratedImageUrl } from "@/services/api";
import type { PredictionResponse } from "@/types";
import { formatDate } from "@/lib/utils";

export default function UploadPage() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const router = useRouter();

  const handleResult = useCallback((data: PredictionResponse) => {
    setResult(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="gradient-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <AnimatePresence mode="wait">
          {!result ? (
            /* Upload Form */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PatientForm onResult={handleResult} />
            </motion.div>
          ) : (
            /* Results */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Analysis Results
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Patient: {result.patient_name} • {result.age} yrs •{" "}
                    {result.gender} • {formatDate(result.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  New Analysis
                </button>
              </div>

              {/* Prediction + Confidence */}
              <div className="grid gap-4 md:grid-cols-2">
                <PredictionCard prediction={result.prediction} />
                <ConfidenceCard confidence={result.confidence} />
              </div>

              {/* Grad-CAM Viewer */}
              <GradCAMViewer
                originalImage={
                  result.image_path
                    ? getGeneratedImageUrl(
                        `/generated/heatmaps/${result.image_path.split("/").pop()?.split("\\").pop()}`
                      )
                    : undefined
                }
                heatmapImage={
                  result.gradcam_image
                    ? getGeneratedImageUrl(result.gradcam_image)
                    : null
                }
                overlayImage={
                  result.overlay_image
                    ? getGeneratedImageUrl(result.overlay_image)
                    : null
                }
              />

              {/* Medical Report */}
              <MedicalReport
                report={result.llm_report}
                patientName={result.patient_name}
                prediction={result.prediction}
                confidence={result.confidence}
              />

              {/* View in History */}
              <div className="flex justify-center pt-4">
                <Link
                  href={`/report/${result.prediction_id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Eye className="h-4 w-4" />
                  View Full Details
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
