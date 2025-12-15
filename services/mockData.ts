
import { PatientProfile, TreatmentPlan, UserRole } from "../types";

// Helper to generate random past dates
const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Placeholder image for mock data (a generic document icon)
const MOCK_IMG_URL = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

// Base Template for a patient
const createPatient = (id: string, name: string, age: number, diagnosis: string, treatment: TreatmentPlan): PatientProfile => {
  return {
    id,
    name,
    age,
    gender: id === '555' || id === '222' ? 'Female' : 'Male',
    height: 170,
    weight: 65,
    diagnosis,
    currentTreatment: treatment,
    messages: [
      {
        id: 'msg-1',
        sender: 'DOCTOR',
        content: `你好，${name}。请记得按时记录每日的身体状况，这对调整治疗方案很有帮助。`,
        timestamp: getDateDaysAgo(3),
        isRead: false
      }
    ],
    history: {
      reports: [
        {
          id: 'rep-1',
          date: getDateDaysAgo(30),
          reportType: 'LAB',
          metrics: { 'WBC': 6.5, 'Hemoglobin': 135, 'Platelet': 200, 'ALT': 25 },
          summary: "入院前基线检查，各项指标正常。",
          clinicalAnalysis: "患者基线血常规正常。白细胞 (WBC 6.5) 处于正常范围，血红蛋白 (Hb 135) 无贫血迹象。肝功能 ALT 正常。建议保持当前状态，准备开始第一周期治疗。",
          imageUrl: MOCK_IMG_URL
        },
        {
          id: 'rep-2',
          date: getDateDaysAgo(7),
          reportType: 'LAB',
          metrics: { 'WBC': 3.8, 'Hemoglobin': 110, 'Platelet': 150, 'ALT': 30 },
          summary: "化疗后骨髓抑制表现，白细胞略低。",
          clinicalAnalysis: "化疗后第7天复查。白细胞 (WBC) 降至 3.8，提示轻度骨髓抑制 (I度)，暂无需升白针干预，但需密切观察体温。血红蛋白下降至 110，轻度贫血。血小板正常。建议：注意保暖，避免感染。",
          imageUrl: MOCK_IMG_URL
        },
        {
          id: 'rep-3',
          date: getDateDaysAgo(2),
          reportType: 'CT',
          metrics: { 'TumorSize': 2.5 },
          summary: "胸部 CT 复查，肿瘤较前缩小。",
          clinicalAnalysis: "影像学疗效评估：PR (部分缓解)。右肺上叶原发灶最大径从基线 3.2cm 缩小至 2.5cm。未见新发转移灶。纵隔淋巴结较前缩小。提示当前治疗方案有效。",
          imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        }
      ],
      checkIns: [
        {
          date: getDateDaysAgo(1),
          temperature: 36.8,
          weight: 64.5,
          dtScore: 2,
          hadsResult: {
            anxietyScore: 3,
            anxietyLevel: 'Normal',
            depressionScore: 2,
            depressionLevel: 'Normal'
          },
          symptomLog: [],
          mood: 'Good',
          notes: '感觉还不错。'
        },
        {
          date: getDateDaysAgo(2),
          temperature: 37.0,
          weight: 65.0,
          dtScore: 5, // Mild distress
          hadsResult: {
             anxietyScore: 8,
             anxietyLevel: 'Mild',
             depressionScore: 6,
             depressionLevel: 'Normal'
          },
          symptomLog: [{ bodyPart: 'Head', specificSymptom: '失眠 (Insomnia)', severity: 4 }],
          mood: 'Neutral',
          notes: ''
        }
      ]
    }
  };
};

// Generate the 5 specific patients
export const MOCK_PATIENTS: PatientProfile[] = [
  createPatient('888', '张伟', 54, '非小细胞肺癌 III期', TreatmentPlan.CHEMO_PLATINUM),
  createPatient('555', '王丽', 48, '肺腺癌 IV期', TreatmentPlan.TARGETED_EGFR),
  createPatient('333', '赵一', 62, '鳞状细胞癌 IIB期', TreatmentPlan.IMMUNO_PD1),
  createPatient('222', '沈二', 35, '小细胞肺癌 局限期', TreatmentPlan.RADIO),
  createPatient('111', '马三', 71, '非小细胞肺癌 IB期', TreatmentPlan.NONE),
];

// Doctor account check
export const DOCTOR_CREDENTIALS = { id: '000', pass: '000', name: '李华' };
