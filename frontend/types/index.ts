export interface PredictionResponse {
  prediction: string;
  confidence: number;
  prediction_id: number;
  patient_name: string;
  age: number;
  gender: string;
  image_path: string;
  gradcam_image: string | null;
  overlay_image: string | null;
  llm_report: string | null;
  created_at: string;
}

export interface PredictionHistoryResponse {
  id: number;
  patient_name: string;
  age: number;
  gender: string;
  image_path: string;
  prediction: string;
  confidence: number;
  gradcam_path: string | null;
  overlay_path: string | null;
  llm_report: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReportResponse {
  prediction_id: number;
  patient_name: string;
  prediction: string;
  confidence: number;
  llm_report: string | null;
  created_at: string;
}

export interface DeleteResponse {
  message: string;
  id: number;
}

export interface HealthResponse {
  status: string;
}

export interface PatientFormData {
  patient_name: string;
  age: number;
  gender: string;
  image: File;
}

export type PredictionLabel = "NORMAL" | "PNEUMONIA";
