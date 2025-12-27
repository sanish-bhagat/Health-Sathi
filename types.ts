
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  GUEST = 'GUEST',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  CRITICAL = 'CRITICAL',
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  // Extended Profile Fields
  bloodGroup?: string;
  age?: string;
  dob?: string; // YYYY-MM-DD
  height?: string;
  weight?: string;
  phone?: string;
  gender?: string;
  specialization?: string; // For Doctors
  hospitalName?: string;   // For Doctors
}

export interface MedicationDetail {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  instructions: string;
}

export interface AIGuidance {
  english_guidance: string;
  local_language_guidance: string;
  detected_language?: string;
  medications: string[]; // Kept for backward compatibility
  medication_details: MedicationDetail[]; // New structured data
  is_critical: boolean;
  critical_reason?: string;
  confidence_score: number;
  extracted_values: Record<string, string>;
  comparison_summary?: string;
}

export interface HealthReport {
  id: string;
  userId: string;
  patientName: string;
  timestamp: number;
  imageUri?: string;
  pdfUri?: string;
  audioUri?: string;
  status: ReportStatus;
  aiAnalysis: AIGuidance | null;
  doctorNotes?: string;
  targetDoctorId?: string; // Link to specific doctor
  targetDoctorName?: string; // Display name of the doctor
}

export interface GeminiContentPart {
  inlineData?: {
    mimeType: string;
    data: string;
  };
  text?: string;
}
