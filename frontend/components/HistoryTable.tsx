"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";
import { cn, formatDateShort, getPredictionColor, getConfidenceColor } from "@/lib/utils";
import { useHistory, useDeletePrediction } from "@/hooks/use-predictions";
import { LoadingSpinner, SkeletonTable } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { PredictionHistoryResponse } from "@/types";

const PAGE_SIZE = 10;

export function HistoryTable() {
  const router = useRouter();
  const { data: history, isLoading, isError, error, refetch } = useHistory();
  const deleteMutation = useDeletePrediction();

  const [search, setSearch] = useState("");
  const [filterPrediction, setFilterPrediction] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!history) return [];
    return history.filter((item) => {
      const matchesSearch = item.patient_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filterPrediction === "all" || item.prediction === filterPrediction;
      return matchesSearch && matchesFilter;
    });
  }, [history, search, filterPrediction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = useCallback(
    (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this prediction?")) {
        setDeletingId(id);
        deleteMutation.mutate(id, {
          onSettled: () => setDeletingId(null),
        });
      }
    },
    [deleteMutation]
  );

  if (isLoading) {
    return <SkeletonTable />;
  }

  if (isError) {
    return (
      <ErrorAlert
        message={error?.message || "Failed to load prediction history."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by patient name..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterPrediction}
            onChange={(e) => {
              setFilterPrediction(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Predictions</option>
            <option value="NORMAL">Normal Only</option>
            <option value="PNEUMONIA">Pneumonia Only</option>
          </select>

          <span className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-16 text-center"
        >
          <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">
            No predictions found
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || filterPrediction !== "all"
              ? "Try adjusting your search or filter."
              : "Upload a chest X-ray to get started."}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/50 bg-card md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prediction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((item, i) => {
                    const predColors = getPredictionColor(item.prediction);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => router.push(`/report/${item.id}`)}
                        className="cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/50 last:border-b-0"
                      >
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">
                          {item.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.patient_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.age} yrs • {item.gender}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                              predColors.bg,
                              predColors.text,
                              predColors.ring
                            )}
                          >
                            <Activity className="h-3 w-3" />
                            {item.prediction}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              getConfidenceColor(item.confidence)
                            )}
                          >
                            {item.confidence.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateShort(item.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/report/${item.id}`);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              title="View details"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              disabled={deletingId === item.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {paginated.map((item, i) => {
              const predColors = getPredictionColor(item.prediction);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/report/${item.id}`)}
                  className="cursor-pointer rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border active:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.patient_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.age} yrs • {item.gender}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        predColors.bg,
                        predColors.text,
                        predColors.ring
                      )}
                    >
                      {item.prediction}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "font-semibold",
                          getConfidenceColor(item.confidence)
                        )}
                      >
                        {item.confidence.toFixed(1)}%
                      </span>
                      <span>{formatDateShort(item.created_at)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-border/50 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
