"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Users, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadCard } from "@/components/UploadCard";
import { usePrediction } from "@/hooks/use-predictions";
import type { PredictionResponse } from "@/types";

const patientSchema = z.object({
  patient_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  age: z
    .number({ invalid_type_error: "Age is required" })
    .int("Age must be a whole number")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be 150 or less"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onResult: (result: PredictionResponse) => void;
}

export function PatientForm({ onResult }: PatientFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const prediction = usePrediction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patient_name: "",
      age: undefined,
      gender: undefined,
    },
  });

  const onSubmit = useCallback(
    async (data: PatientFormValues) => {
      if (!selectedFile) {
        setFileError("Please upload a chest X-ray image.");
        return;
      }
      setFileError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("patient_name", data.patient_name);
      formData.append("age", data.age.toString());
      formData.append("gender", data.gender);
      formData.append("image", selectedFile);

      toast.loading("Analyzing X-ray...", { id: "prediction" });

      prediction.mutate(
        {
          formData,
          onUploadProgress: (progress) => setUploadProgress(progress),
        },
        {
          onSuccess: (result) => {
            toast.success("Analysis Complete!", {
              id: "prediction",
              description: `Prediction: ${result.prediction} (${result.confidence.toFixed(1)}%)`,
            });
            onResult(result);
          },
          onError: () => {
            toast.dismiss("prediction");
            setUploadProgress(0);
          },
        }
      );
    },
    [selectedFile, prediction, onResult]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl"
    >
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                New Analysis
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload an X-ray and enter patient information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Patient Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="patient_name"
              className="text-sm font-medium text-foreground"
            >
              Patient Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="patient_name"
                type="text"
                placeholder="Enter patient full name"
                {...register("patient_name")}
                disabled={prediction.isPending}
                className={cn(
                  "w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  errors.patient_name
                    ? "border-red-300 dark:border-red-800"
                    : "border-border"
                )}
              />
            </div>
            {errors.patient_name && (
              <p className="text-xs text-red-500">
                {errors.patient_name.message}
              </p>
            )}
          </div>

          {/* Age + Gender row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Age */}
            <div className="space-y-1.5">
              <label
                htmlFor="age"
                className="text-sm font-medium text-foreground"
              >
                Age <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="age"
                  type="number"
                  placeholder="Age"
                  {...register("age", { valueAsNumber: true })}
                  disabled={prediction.isPending}
                  className={cn(
                    "w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.age
                      ? "border-red-300 dark:border-red-800"
                      : "border-border"
                  )}
                />
              </div>
              {errors.age && (
                <p className="text-xs text-red-500">{errors.age.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-foreground"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="gender"
                  {...register("gender")}
                  disabled={prediction.isPending}
                  className={cn(
                    "w-full appearance-none rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.gender
                      ? "border-red-300 dark:border-red-800"
                      : "border-border"
                  )}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.gender && (
                <p className="text-xs text-red-500">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <UploadCard
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onRemove={() => {
              setSelectedFile(null);
              setFileError(null);
            }}
            disabled={prediction.isPending}
          />
          {fileError && (
            <p className="text-xs text-red-500">{fileError}</p>
          )}

          {/* Progress Bar */}
          <AnimatePresence>
            {prediction.isPending && uploadProgress > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {uploadProgress < 100
                      ? "Uploading image..."
                      : "Processing with AI..."}
                  </span>
                  <span>{uploadProgress < 100 ? `${uploadProgress}%` : "Analyzing"}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        uploadProgress < 100
                          ? `${uploadProgress}%`
                          : "100%",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {uploadProgress >= 100 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-muted-foreground animate-pulse">
                      Running DenseNet121 inference & generating Grad-CAM...
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={prediction.isPending}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-semibold text-white transition-all",
              prediction.isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
            )}
          >
            {prediction.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Analyze X-ray
              </span>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
