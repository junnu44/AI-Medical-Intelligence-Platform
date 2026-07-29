import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedAI Intelligence — AI-Powered Chest X-ray Analysis",
  description:
    "Advanced AI Medical Intelligence Platform powered by DenseNet121 deep learning for chest X-ray pneumonia detection with Grad-CAM explainability and AI-generated medical reports.",
  keywords: [
    "AI",
    "medical",
    "chest x-ray",
    "pneumonia detection",
    "deep learning",
    "DenseNet121",
    "Grad-CAM",
    "medical AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
