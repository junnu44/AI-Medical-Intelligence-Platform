import axios from "axios";
import type {
  PredictionResponse,
  PredictionHistoryResponse,
  ReportResponse,
  DeleteResponse,
  HealthResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.detail || "An unexpected error occurred.";
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(
        new Error(
          "Unable to reach the server. Please check if the backend is running."
        )
      );
    }
    return Promise.reject(new Error("An unexpected error occurred."));
  }
);

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function submitPrediction(
  formData: FormData,
  onUploadProgress?: (progress: number) => void
): Promise<PredictionResponse> {
  const { data } = await api.post<PredictionResponse>("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onUploadProgress) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onUploadProgress(progress);
      }
    },
  });
  return data;
}

export async function getHistory(): Promise<PredictionHistoryResponse[]> {
  const { data } = await api.get<PredictionHistoryResponse[]>("/history");
  return data;
}

export async function getHistoryById(
  id: number
): Promise<PredictionHistoryResponse> {
  const { data } = await api.get<PredictionHistoryResponse>(
    `/history/${id}`
  );
  return data;
}

export async function deleteHistory(id: number): Promise<DeleteResponse> {
  const { data } = await api.delete<DeleteResponse>(`/history/${id}`);
  return data;
}

export async function getReport(id: number): Promise<ReportResponse> {
  const { data } = await api.get<ReportResponse>(`/report/${id}`);
  return data;
}

export function getGradCAMUrl(id: number): string {
  return `${API_BASE_URL}/gradcam/${id}`;
}

export function getGeneratedImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

export default api;
