"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Copy,
  Share2,
  Download,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MedicalReportProps {
  report: string | null;
  patientName?: string;
  prediction?: string;
  confidence?: number;
  className?: string;
}

export function MedicalReport({
  report,
  patientName,
  prediction,
  confidence,
  className,
}: MedicalReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      toast.success("Report copied to clipboard");
    } catch {
      toast.error("Failed to copy report");
    }
  }, [report]);

  const handleShare = useCallback(async () => {
    if (!report) return;
    const shareText = `AI Medical Report — ${patientName || "Patient"}\nPrediction: ${prediction} (${confidence?.toFixed(1)}%)\n\n${report}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Medical Report",
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Report copied to clipboard for sharing");
      } catch {
        toast.error("Unable to share");
      }
    }
  }, [report, patientName, prediction, confidence]);

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;

    toast.loading("Generating PDF...", { id: "pdf" });

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10;

      // Add header
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("AI Medical Intelligence Report", 10, position);
      position += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Patient: ${patientName || "N/A"} | Prediction: ${prediction || "N/A"} | Confidence: ${confidence?.toFixed(1) || "N/A"}%`,
        10,
        position
      );
      position += 5;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, position);
      position += 10;

      // Add report image, handle multi-page
      if (imgHeight + position > pageHeight - 10) {
        // Multi-page approach
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const firstPageAvailable = pageHeight - position - 10;
        const firstPageImgHeight = firstPageAvailable;
        const firstPageSourceHeight =
          (firstPageImgHeight / imgHeight) * canvas.height;

        pdf.addImage(
          imgData,
          "PNG",
          10,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        // For simplicity, scale down to fit
        const scaledHeight = Math.min(imgHeight, pageHeight - position - 10);
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      }

      // Disclaimer footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(150);
        pdf.text(
          "This report is AI-generated and for informational purposes only. Consult a healthcare professional.",
          10,
          pageHeight - 5
        );
      }

      pdf.save(`medical_report_${patientName?.replace(/\s+/g, "_") || "patient"}_${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully", { id: "pdf" });
    } catch (error) {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  }, [patientName, prediction, confidence]);

  if (!report || report === "report_generation_failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-900/50 dark:bg-orange-950/20",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div>
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              Report Unavailable
            </h3>
            <p className="text-xs text-orange-700/70 dark:text-orange-400/70">
              The AI report could not be generated. This may be due to API
              limits or configuration issues.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        "rounded-2xl border border-border/50 bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-foreground">
            AI Medical Report
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Generated
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Copy report"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Share report"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
            title="Download as PDF"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="p-6">
        <div className="medical-report prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
