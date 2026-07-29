"use client";

import { use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Calendar,
  Users,
  Clock,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { useHistoryDetail, useReport } from "@/hooks/use-predictions";
import { PredictionCard } from "@/components/PredictionCard";
import { ConfidenceCard } from "@/components/ConfidenceCard";
import { GradCAMViewer } from "@/components/GradCAMViewer";
import { MedicalReport } from "@/components/MedicalReport";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { formatDate, getApiUrl } from "@/lib/utils";
import { getGradCAMUrl } from "@/services/api";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id, 10);
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
    refetch: refetchDetail,
  } = useHistoryDetail(id);
  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
  } = useReport(id);

  if (detailLoading || reportLoading) {
    return (
      <LoadingSpinner
        message="Loading prediction details..."
        size="lg"
        fullPage
      />
    );
  }

  if (detailError || !detail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorAlert
          title="Prediction Not Found"
          message={
            detailErrorObj?.message ||
            "Unable to load prediction details. The record may have been deleted."
          }
          onRetry={() => refetchDetail()}
        />
        <div className="mt-4 text-center">
          <Link
            href="/history"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const gradcamOverlayUrl = getGradCAMUrl(detail.id);

  return (
    <div className="gradient-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Back */}
        <Link
          href="/history"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Prediction Details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete analysis report for prediction #{detail.id}
          </p>
        </motion.div>

        {/* Patient Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-2xl border border-border/50 bg-card p-5"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patient Information
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">ID</p>
                <p className="text-sm font-semibold text-foreground">
                  {detail.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Name</p>
                <p className="text-sm font-semibold text-foreground">
                  {detail.patient_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Age</p>
                <p className="text-sm font-semibold text-foreground">
                  {detail.age} years
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Gender</p>
                <p className="text-sm font-semibold text-foreground">
                  {detail.gender}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Analyzed</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(detail.created_at)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prediction + Confidence */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <PredictionCard prediction={detail.prediction} />
          <ConfidenceCard confidence={detail.confidence} />
        </div>

        {/* Grad-CAM */}
        <div className="mb-6">
          <GradCAMViewer
            overlayImage={gradcamOverlayUrl}
            heatmapImage={
              detail.gradcam_path
                ? getApiUrl(
                    `/generated/heatmaps/${detail.gradcam_path.split("/").pop()?.split("\\").pop()}`
                  )
                : null
            }
          />
        </div>

        {/* Medical Report */}
        <MedicalReport
          report={report?.llm_report || detail.llm_report}
          patientName={detail.patient_name}
          prediction={detail.prediction}
          confidence={detail.confidence}
        />
      </div>
    </div>
  );
}
