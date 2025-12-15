
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR'
}

export enum TreatmentPlan {
  CHEMO_PLATINUM = '化疗 (含铂双药)',
  TARGETED_EGFR = '靶向治疗 (EGFR-TKI)',
  IMMUNO_PD1 = '免疫治疗 (PD-1/PD-L1)',
  RADIO = '放射治疗 (Radiotherapy)',
  SURGERY = '外科手术 (Surgery)',
  NONE = '未设置 / 观察期'
}

export interface ReportData {
  id: string; 
  metrics: Record<string, number>;
  date: string;
  summary: string;
  clinicalAnalysis?: string; 
  reportType: 'LAB' | 'CT'; // Removed MRI
  imageUrl?: string; 
}

export interface HADSResult {
  anxietyScore: number;
  anxietyLevel: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  depressionScore: number;
  depressionLevel: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface DailyCheckIn {
  date: string;
  temperature: number;
  weight?: number; 
  dtScore?: number; // New: Distress Thermometer Score (0-10)
  hadsResult?: HADSResult; 
  symptomLog: SymptomEntry[]; 
  mood: 'Great' | 'Good' | 'Neutral' | 'Bad' | 'Awful';
  notes: string;
}

export interface SymptomEntry {
  bodyPart: string;
  specificSymptom: string;
  severity: number; // 0-10
  duration?: string; // New: Duration of the symptom
}

export interface StructuredAdvice {
  category: 'Nutrition' | 'Rehab' | 'Psych' | 'Medication' | 'SideEffect';
  title: string;
  content: string;
  source: string;
  isComforting?: boolean;
  severityLevel?: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface SideEffectAdvice {
  symptom: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  careGuide: string;
  seekDoctor: boolean;
}

export interface Message {
  id: string;
  sender: 'PATIENT' | 'DOCTOR';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface PatientProfile {
  id: string; 
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  height: number; // cm
  weight: number; // kg
  diagnosis: string;
  currentTreatment: TreatmentPlan; 
  treatmentStartDate?: string;
  messages: Message[];
  history: {
    reports: ReportData[];
    checkIns: DailyCheckIn[];
  }
}

// --- Rich Database Types ---

export interface RichSideEffect {
  id: string;
  name: string;
  mechanism?: string;
  riskFactors?: string;
  management: {
    strategyName?: string;
    description?: string;
    actionableSteps: string[]; // List of specific actions
    medications?: string[];
    whenToSeekHelp?: string;
  };
  comfortMessage?: string;
}

export interface RichCategory {
  id: string;
  name: string;
  description: string;
  adverseEvents: RichSideEffect[];
}

export interface NutritionGuideline {
  id: string;
  condition: string; // e.g., "Nausea", "General"
  content: string;
  allowedFoods: string[];
  avoidFoods: string[];
}
