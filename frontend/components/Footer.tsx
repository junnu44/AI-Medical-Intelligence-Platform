import { Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              MedAI Intelligence
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="transition-colors hover:text-foreground"
            >
              Upload
            </Link>
            <Link
              href="/history"
              className="transition-colors hover:text-foreground"
            >
              History
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground/70 md:text-right max-w-sm">
            AI-generated predictions are for informational purposes only. Always
            consult a qualified healthcare professional.
          </p>
        </div>

        <div className="mt-6 border-t border-border/30 pt-4">
          <p className="text-center text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Advanced AI Medical Intelligence
            Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
