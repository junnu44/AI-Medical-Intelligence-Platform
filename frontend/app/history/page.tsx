"use client";

import { motion } from "framer-motion";
import { History, Upload } from "lucide-react";
import Link from "next/link";
import { HistoryTable } from "@/components/HistoryTable";

export default function HistoryPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25">
                <History className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Prediction History
              </h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Browse and manage all past chest X-ray analyses
            </p>
          </div>
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
          >
            <Upload className="h-4 w-4" />
            New Analysis
          </Link>
        </motion.div>

        {/* Table */}
        <HistoryTable />

        {/* Mobile FAB */}
        <Link
          href="/upload"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30 transition-transform hover:scale-105 sm:hidden"
          aria-label="New Analysis"
        >
          <Upload className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
