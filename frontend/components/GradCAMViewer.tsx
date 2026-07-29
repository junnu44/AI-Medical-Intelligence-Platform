"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  X,
  Layers,
  ImageIcon,
  Flame,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GradCAMViewerProps {
  originalImage?: string;
  heatmapImage?: string | null;
  overlayImage?: string | null;
  className?: string;
}

type ViewTab = "original" | "heatmap" | "overlay";

const tabs: { key: ViewTab; label: string; icon: typeof ImageIcon }[] = [
  { key: "original", label: "Original", icon: ImageIcon },
  { key: "heatmap", label: "Heatmap", icon: Flame },
  { key: "overlay", label: "Overlay", icon: Layers },
];

export function GradCAMViewer({
  originalImage,
  heatmapImage,
  overlayImage,
  className,
}: GradCAMViewerProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("overlay");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage =
    activeTab === "original"
      ? originalImage
      : activeTab === "heatmap"
      ? heatmapImage
      : overlayImage;

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.25, 3)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.25, 0.5)),
    []
  );

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gradcam_${activeTab}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentImage, "_blank");
    }
  }, [currentImage, activeTab]);

  if (!originalImage && !heatmapImage && !overlayImage) {
    return null;
  }

  const imageViewer = (isFullscreenMode: boolean) => (
    <div
      className={cn(
        "space-y-4",
        isFullscreenMode && "flex flex-col h-full"
      )}
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const imgAvailable =
            tab.key === "original"
              ? !!originalImage
              : tab.key === "heatmap"
              ? !!heatmapImage
              : !!overlayImage;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (imgAvailable) {
                  setActiveTab(tab.key);
                  setZoom(1);
                }
              }}
              disabled={!imgAvailable}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : imgAvailable
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/50 bg-black/5 dark:bg-white/5",
          isFullscreenMode ? "flex-1" : "aspect-square"
        )}
      >
        {currentImage ? (
          <div className="h-full w-full overflow-auto flex items-center justify-center">
            <img
              src={currentImage}
              alt={`${activeTab} view`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Image not available
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-14 text-center text-xs font-medium text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {currentImage && (
            <button
              onClick={handleDownload}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
          {!isFullscreenMode && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn(
          "rounded-2xl border border-border/50 bg-card p-6",
          className
        )}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Grad-CAM Explainability
        </h3>
        {imageViewer(false)}
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm p-4 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Grad-CAM Viewer — Fullscreen
              </h3>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setZoom(1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close fullscreen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{imageViewer(true)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

