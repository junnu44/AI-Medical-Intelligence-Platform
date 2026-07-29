"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function UploadCard({
  onFileSelect,
  selectedFile,
  onRemove,
  disabled = false,
}: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a JPG, JPEG, or PNG image.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`
        );
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [disabled, validateAndSetFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
      e.target.value = "";
    },
    [validateAndSetFile]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onRemove();
  }, [previewUrl, onRemove]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Chest X-ray Image <span className="text-red-500">*</span>
      </label>

      <AnimatePresence mode="wait">
        {selectedFile && previewUrl ? (
          /* Preview */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card"
          >
            <div className="relative aspect-[4/3] w-full">
              <img
                src={previewUrl}
                alt="X-ray preview"
                className="h-full w-full object-contain bg-black/5 dark:bg-white/5"
              />
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs opacity-70">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Remove button */}
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ) : (
          /* Drop Zone */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
                isDragging
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.02]"
                  : "border-border hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/10",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="hidden"
                disabled={disabled}
              />
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                className={cn(
                  "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                  isDragging
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-muted"
                )}
              >
                <Upload
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isDragging
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground"
                  )}
                />
              </motion.div>
              <p className="mb-1 text-sm font-medium text-foreground">
                {isDragging ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, JPEG, or PNG — Max 10 MB
              </p>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/20"
          >
            <FileWarning className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
