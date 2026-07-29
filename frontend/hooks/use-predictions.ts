import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkHealth,
  submitPrediction,
  getHistory,
  getHistoryById,
  deleteHistory,
  getReport,
} from "@/services/api";
import type { PredictionResponse } from "@/types";
import { toast } from "sonner";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    retry: 1,
    refetchInterval: 30000,
  });
}

export function usePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formData,
      onUploadProgress,
    }: {
      formData: FormData;
      onUploadProgress?: (progress: number) => void;
    }) => submitPrediction(formData, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error: Error) => {
      toast.error("Prediction Failed", {
        description: error.message,
      });
    },
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ["history"],
    queryFn: getHistory,
    retry: 2,
    staleTime: 30000,
  });
}

export function useHistoryDetail(id: number) {
  return useQuery({
    queryKey: ["history", id],
    queryFn: () => getHistoryById(id),
    enabled: id > 0,
    retry: 2,
  });
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
    enabled: id > 0,
    retry: 2,
  });
}

export function useDeletePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHistory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Deleted", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("Delete Failed", {
        description: error.message,
      });
    },
  });
}
