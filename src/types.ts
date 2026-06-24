export interface CivicReport {
  id: string;
  source: "voice_input" | "social_listening" | "whatsapp";
  status: "needs_confirmation" | "assigned" | "overdue" | "resolved";
  issueType: "Water Supply" | "Roads & Potholes" | "Sewage & Drainage" | "Solid Waste" | "Streetlights";
  rawTranscript: string;
  englishTranslation: string;
  locationContext: string;
  landmark: string;
  city: string;
  latitude: number;
  longitude: number;
  severity: number; // 1 to 5
  socialSignalCount: number;
  socialPressureScore: number;
  createdAt: string;
  updatedAt: string;
  assignedDept: string;
  citations: number;
  photoUrl?: string;
  slaDeadline: string;
  socialPosts?: Array<{ source: string; text: string; handle: string; date: string }>;
}

export interface LeaderboardStats {
  assigned_dept: string;
  avg_resolve_time_hours: number;
  total_resolved: number;
  total_overdue: number;
  total_pending: number;
  performance_rank: number;
}
