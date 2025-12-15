
import React, { useState, useMemo, useEffect } from 'react';
import { PatientProfile, ReportData, StructuredAdvice, TreatmentPlan, SymptomEntry, HADSResult } from '../types';
import BodyMap from './BodyMap';
import SmartUpload from './SmartUpload';
import { SYMPTOM_OPTIONS, generateSmartAdvice, getSideEffectsForTreatment, HADS_QUESTIONS, calculateHADSLevel } from '../services/knowledgeBase';
import { getDrugSideEffectAdvice } from '../services/geminiService';
import { Heart, Activity, Thermometer, Smile, AlertCircle, Sparkles, Plus, FileText, ChevronRight, ArrowLeft, TrendingUp, CheckCircle, BrainCircuit, Pill, ShieldCheck, Zap, Info, CalendarCheck, HeartPulse, Stethoscope, Utensils, Clock, Sun, Moon, Quote, Gauge, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PatientSubSection } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

interface PatientDashboardProps {
  patient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
  activeSection: PatientSubSection;
  onChangeSection: (section: PatientSubSection) => void;
}

const METRIC_DICT: Record<string, string> = {
  'WBC': '白细胞 (WBC)',
  'Hemoglobin': '血红蛋白 (Hb)',
  'Platelet': '血小板 (PLT)',
  'ALT': '谷丙转氨酶',
  'AST': '谷草转氨酶',
  'Neutrophil': '中性粒细胞'
};

// Standard Reference Ranges (Mock data for visualization)
const REF_RANGES: Record<string, { min: number, max: number, unit: string }> = {
  'WBC': { min: 4.0, max: 10.0, unit: '10^9/L' },
  'Hemoglobin': { min: 115, max: 150, unit: 'g/L' },
  'Platelet': { min: 100, max: 300, unit: '10^9/L' },
  'Neutrophil': { min: 1.8, max: 6.3, unit: '10^9/L' }
};

const CHART_COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

const DURATION_OPTIONS = ['< 1小时', '1-4 小时', '半天', '全天', '持续多日'];

const DAILY_QUOTES = [
    "世界上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。——罗曼·罗兰",
    "每一个不曾起舞的日子，都是对生命的辜负。——尼采",
    "希望能像阳光一样，不偏不倚地洒在每个人身上。",
    "在此刻的身体里，安住下来。",
    "通过裂缝，光才能照进来。"
];

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onUpdatePatient, activeSection, onChangeSection }) => {
  // --- MEDICAL RECORD STATE ---
  const [recordMode, setRecordMode] = useState<'LIST' | 'DETAIL' | 'UPLOAD'>('LIST');
  const [recordTab, setRecordTab] = useState<'LAB' | 'CT'>('LAB');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['WBC', 'Hemoglobin']); 

  // --- CHECK-IN WIZARD STATE ---
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'INTRO' | 'VITALS' | 'DT' | 'HADS' | 'SYMPTOMS' | 'RESULT'>('INTRO');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  
  // Vitals
  const [weight, setWeight] = useState<number>(patient.weight || 60);
  const [temp, setTemp] = useState<number>(36.5);
  
  // DT (Distress Thermometer)
  const [dtScore, setDtScore] = useState<number>(0);

  // HADS
  const [hadsAnswers, setHadsAnswers] = useState<Record<number, number>>({});
  const [currentHadsQuestion, setCurrentHadsQuestion] = useState(0);

  // Symptoms
  const [symptomLog, setSymptomLog] = useState<SymptomEntry[]>([]);
  const [adviceList, setAdviceList] = useState<StructuredAdvice[]>([]);
  
  // Modal/Selection State
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [customSymptomText, setCustomSymptomText] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState<number>(3);
  const [symptomDuration, setSymptomDuration] = useState<string>('半天');
  const [dailyQuote, setDailyQuote] = useState('');

  // Predicted Side Effects for Quick Select
  const likelySideEffects = useMemo(() => getSideEffectsForTreatment(patient.currentTreatment), [patient.currentTreatment]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysCheckIn = patient.history.checkIns.find(c => c.date === today);
    setDailyQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);

    if (todaysCheckIn) {
        setIsCheckedInToday(true);
        setCheckInStep('RESULT');
        const symptoms = todaysCheckIn.symptomLog.map(s => s.specificSymptom);
        const advice = generateSmartAdvice(patient.currentTreatment, symptoms, todaysCheckIn.hadsResult, todaysCheckIn.dtScore);
        setAdviceList(advice);
        if (todaysCheckIn.dtScore !== undefined) setDtScore(todaysCheckIn.dtScore);
    } else {
        setCheckInStep('INTRO');
    }
  }, [patient]);

  // --- HADS LOGIC ---
  const handleHadsAnswer = (score: number) => {
      setHadsAnswers(prev => ({ ...prev, [HADS_QUESTIONS[currentHadsQuestion].id]: score }));
      if (currentHadsQuestion < HADS_QUESTIONS.length - 1) {
          setCurrentHadsQuestion(prev => prev + 1);
      } else {
          setCheckInStep('SYMPTOMS');
      }
  };

  const calculateScores = (): HADSResult => {
      let aScore = 0;
      let dScore = 0;
      HADS_QUESTIONS.forEach(q => {
          const score = hadsAnswers[q.id] || 0;
          if (q.category === 'A') aScore += score;
          else dScore += score;
      });
      return {
          anxietyScore: aScore,
          anxietyLevel: calculateHADSLevel(aScore),
          depressionScore: dScore,
          depressionLevel: calculateHADSLevel(dScore)
      };
  };

  // --- SYMPTOM LOGIC ---
  const handleBodyPartClick = (part: string) => {
    setActiveBodyPart(part);
    setModalSymptoms(SYMPTOM_OPTIONS[part] || SYMPTOM_OPTIONS['General']);
    setSelectedSymptom(null);
    setCustomSymptomText('');
    setSymptomSeverity(3);
    setSymptomDuration('半天');
  };

  const confirmSymptom = () => {
      const finalSymptomName = selectedSymptom === 'OTHER' ? customSymptomText : selectedSymptom;
      
      if (!finalSymptomName) return;

      const newEntry: SymptomEntry = {
        bodyPart: activeBodyPart || 'General',
        specificSymptom: finalSymptomName,
        severity: symptomSeverity,
        duration: symptomDuration
      };
      
      const existingIdx = symptomLog.findIndex(s => s.specificSymptom === finalSymptomName);
      let newLog = [...symptomLog];
      if (existingIdx >= 0) {
        newLog[existingIdx] = newEntry;
      } else {
        newLog.push(newEntry);
      }
      setSymptomLog(newLog);
      setActiveBodyPart(null);
  };

  const toggleQuickSymptom = (name: string) => {
      const existing = symptomLog.find(s => s.specificSymptom === name);
      if (existing) {
          setSymptomLog(symptomLog.filter(s => s.specificSymptom !== name));
      } else {
          // Default severity 3, duration '半天' for quick add
          const newEntry: SymptomEntry = {
              bodyPart: 'General',
              specificSymptom: name,
              severity: 3,
              duration: '半天'
          };
          setSymptomLog([...symptomLog, newEntry]);
      }
  };

  // --- SUBMIT ---
  const submitCheckIn = async () => {
    setIsGeneratingAdvice(true);
    const hadsResult = calculateScores();
    const symptoms = symptomLog.map(s => s.specificSymptom);
    
    // 1. Generate Static Advice (Nutrition, Psych)
    let finalAdvice = generateSmartAdvice(patient.currentTreatment, symptoms, hadsResult, dtScore);

    // 2. Generate AI Advice for Symptoms
    if (symptoms.length > 0) {
      try {
        const aiAdvice = await getDrugSideEffectAdvice(patient.currentTreatment, symptoms);
        const aiStructuredAdvice: StructuredAdvice[] = aiAdvice.map(a => ({
           category: 'SideEffect',
           title: `针对"${a.symptom}"的智能护理建议`,
           content: `${a.careGuide}${a.seekDoctor ? '\n\n⚠️ 警告：根据分析，建议您尽快咨询医生。' : ''}`,
           source: "LungCare AI 实时生成",
           severityLevel: a.severity
        }));

        // Merge: Prioritize AI advice for side effects, keep static advice for other categories
        finalAdvice = [...aiStructuredAdvice, ...finalAdvice.filter(a => a.category !== 'SideEffect')];
      } catch (error) {
        console.error("Failed to generate AI advice", error);
        // Fallback to static advice only (already in finalAdvice)
      }
    }

    setAdviceList(finalAdvice);

    const newCheckIn = {
      date: new Date().toISOString().split('T')[0],
      temperature: temp,
      weight: weight,
      dtScore: dtScore,
      hadsResult: hadsResult,
      symptomLog: symptomLog,
      mood: 'Neutral' as const, 
      notes: ''
    };

    onUpdatePatient({
      ...patient,
      weight: weight,
      history: {
        ...patient.history,
        checkIns: [...patient.history.checkIns, newCheckIn]
      }
    });

    setIsCheckedInToday(true);
    setCheckInStep('RESULT');
    setIsGeneratingAdvice(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- WIDGET: DAILY GREETING ---
  const GreetingWidget = () => {
      const hour = new Date().getHours();
      const isMorning = hour >= 5 && hour < 12;
      const isAfternoon = hour >= 12 && hour < 18;
      const greeting = isMorning ? "早安" : isAfternoon ? "午安" : "晚上好";
      const Icon = isMorning ? Sun : Moon;
      
      // Calculate Days Since Diagnosis (Mock)
      const daysSince = Math.floor((new Date().getTime() - new Date(patient.treatmentStartDate || "2023-01-01").getTime()) / (1000 * 3600 * 24));

      return (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                      <div className="flex items-center gap-2 text-indigo-100 font-medium mb-2 text-sm">
                          <Icon className="w-4 h-4" /> {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <h2 className="text-3xl font-bold mb-4">{greeting}，{patient.name}</h2>
                      <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                          <Quote className="w-8 h-8 text-indigo-200 opacity-50 flex-shrink-0" />
                          <p className="text-sm md:text-base italic opacity-90 leading-relaxed font-serif">
                              {dailyQuote}
                          </p>
                      </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center justify-center bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                      <span className="text-xs uppercase tracking-widest opacity-70 mb-1">抗癌旅程</span>
                      <span className="text-4xl font-bold font-mono">{daysSince}</span>
                      <span className="text-xs opacity-70 mt-1">Days Strong</span>
                  </div>
              </div>
              
              {/* Decorative Background Circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
          </div>
      );
  };

  const MedicalRecordModule = () => {
    // ... existing medical record code ...
    const reports = patient.history.reports.filter(r => r.reportType === recordTab).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allMetrics = useMemo(() => {
        const keys = new Set<string>();
        reports.forEach(r => Object.keys(r.metrics).forEach(k => keys.add(k)));
        return Array.from(keys);
    }, [reports]);

    const chartData = useMemo(() => {
        return [...reports].reverse().map(r => ({
            date: r.date,
            displayDate: r.date.split('-').slice(1).join('/'), // MM/DD format
            ...r.metrics
        }));
    }, [reports]);

    if (recordMode === 'UPLOAD') {
      return (
        <div className="max-w-3xl mx-auto animate-scale-in">
           <button onClick={() => setRecordMode('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6">
             <ArrowLeft className="w-4 h-4" /> 返回列表
           </button>
           <SmartUpload onReportAnalyzed={(data) => {
               const updated = { ...patient, history: { ...patient.history, reports: [...patient.history.reports, data] }};
               onUpdatePatient(updated);
               setSelectedReport(data);
               setRecordMode('DETAIL');
           }} />
        </div>
      );
    }

    if (recordMode === 'DETAIL' && selectedReport) {
      return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-20 relative">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                <button onClick={() => setRecordMode('LIST')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                   <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     {selectedReport.reportType === 'LAB' ? '检验报告' : 'CT 影像报告'}
                     <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{selectedReport.date}</span>
                   </h2>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)] min-h-[600px]">
             <div className="bg-black/5 rounded-2xl border border-slate-200 overflow-hidden relative group flex items-center justify-center bg-slate-100">
                {selectedReport.imageUrl ? (
                  <img src={selectedReport.imageUrl} alt="Original Report" className="max-w-full max-h-full object-contain" />
                ) : <div className="text-slate-400">原图未存档</div>}
             </div>
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                   <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-indigo-600" /> AI 智能分析结果
                   </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> 临床解读摘要</h4>
                      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReport.clinicalAnalysis || selectedReport.summary}</div>
                   </div>
                   <div className="space-y-3">
                      {Object.entries(selectedReport.metrics).map(([key, value]) => (
                         <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{METRIC_DICT[key] || key}</span>
                            <span className="text-lg font-mono font-bold text-slate-800">{value}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-20">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <Activity className="w-7 h-7 text-indigo-600" /> 医疗档案中心
             </h2>
             <p className="text-slate-500 mt-2">您的专属健康数据银行。</p>
           </div>
           <button onClick={() => setRecordMode('UPLOAD')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
             <Plus className="w-5 h-5" /> 上传新报告
           </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
            {[
                { id: 'LAB', label: '血常规 / 生化' },
                { id: 'CT', label: 'CT 影像专栏' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setRecordTab(tab.id as any)}
                    className={clsx(
                        "px-6 py-2 rounded-lg font-bold text-sm transition-all relative",
                        recordTab === tab.id ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    {tab.label}
                    {recordTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
                </button>
            ))}
        </div>

        {recordTab === 'LAB' && allMetrics.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" /> 核心指标合并趋势
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        <div className="w-3 h-3 bg-slate-200/50 rounded-sm"></div> 
                        灰色区域代表医学参考正常范围
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-6">
                    {allMetrics.map((m, i) => (
                        <button 
                            key={m}
                            onClick={() => {
                                if (selectedMetrics.includes(m)) setSelectedMetrics(selectedMetrics.filter(x => x !== m));
                                else setSelectedMetrics([...selectedMetrics, m]);
                            }}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2",
                                selectedMetrics.includes(m) ? "bg-white shadow-sm ring-1" : "bg-slate-50 border-slate-100 text-slate-400 opacity-60 grayscale"
                            )}
                            style={selectedMetrics.includes(m) ? { 
                                color: CHART_COLORS[i % CHART_COLORS.length], 
                                borderColor: CHART_COLORS[i % CHART_COLORS.length], 
                                '--tw-ring-color': CHART_COLORS[i % CHART_COLORS.length] 
                            } as React.CSSProperties : {}}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedMetrics.includes(m) ? CHART_COLORS[i % CHART_COLORS.length] : '#cbd5e1' }} />
                            {METRIC_DICT[m] || m}
                        </button>
                    ))}
                </div>
                <div className="h-[400px] w-full bg-gradient-to-b from-white to-slate-50/50 rounded-xl p-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="displayDate" 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                tickMargin={10}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle"/>
                            
                            {/* Render Reference Areas for selected metrics */}
                            {selectedMetrics.map((m, i) => {
                                const range = REF_RANGES[m];
                                if (!range) return null;
                                return (
                                    <ReferenceArea 
                                        key={`ref-${m}`}
                                        y1={range.min} 
                                        y2={range.max} 
                                        fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                        fillOpacity={0.05}
                                        strokeOpacity={0}
                                        ifOverflow="extendDomain"
                                    />
                                );
                            })}

                            {selectedMetrics.map((m, i) => (
                                <Line 
                                    key={m} 
                                    type="monotone" 
                                    dataKey={m} 
                                    name={METRIC_DICT[m] || m}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                                    strokeWidth={3} 
                                    dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                                    activeDot={{r: 6, strokeWidth: 0}}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div className="space-y-4">
            {reports.map(r => (
                <div key={r.id} onClick={() => { setSelectedReport(r); setRecordMode('DETAIL'); }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex justify-between items-center">
                    <div className="flex items-start gap-4">
                        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0", r.reportType === 'LAB' ? "bg-blue-500" : "bg-purple-500")}>
                            {r.reportType}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-slate-800">{r.date}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">ID: {r.id}</span>
                            </div>
                            <p className="text-slate-600 text-sm max-w-2xl line-clamp-1">{r.summary}</p>
                            <div className="flex gap-2 mt-2">
                                {Object.keys(r.metrics).slice(0, 3).map(k => (
                                    <span key={k} className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">{METRIC_DICT[k] || k}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                </div>
            ))}
        </div>
      </div>
    );
  };

  const CareCenterView = () => {
    // --- 1. INTRO / WELCOME STEP ---
    if (checkInStep === 'INTRO') {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in pt-6">
                <GreetingWidget />

                <div className="max-w-2xl mx-auto text-center pt-8">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100">
                        <CalendarCheck className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">开启今日健康打卡</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">请花 2 分钟记录您的身体和心理状态，AI 将为您生成今日专属的干预方案。</p>
                    <button onClick={() => setCheckInStep('VITALS')} className="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
                        开始记录
                    </button>
                </div>
            </div>
        );
    }

    // --- 2. VITALS STEP ---
    if (checkInStep === 'VITALS') {
        return (
            <div className="max-w-xl mx-auto pt-10 animate-slide-up">
                <button onClick={() => setCheckInStep('INTRO')} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> 返回</button>
                <h2 className="text-2xl font-bold text-slate-800 mb-8">1. 基础体征记录</h2>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 block">今日体温 (℃)</label>
                        <div className="flex items-center gap-4">
                            <Thermometer className="w-8 h-8 text-blue-500" />
                            <input type="number" step="0.1" value={temp} onChange={e => setTemp(parseFloat(e.target.value))} className="w-full text-4xl font-bold text-slate-800 outline-none border-b border-slate-200 focus:border-blue-500 transition-colors py-2" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 block">今日体重 (kg)</label>
                        <div className="flex items-center gap-4">
                            <TrendingUp className="w-8 h-8 text-emerald-500" />
                            <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value))} className="w-full text-4xl font-bold text-slate-800 outline-none border-b border-slate-200 focus:border-emerald-500 transition-colors py-2" />
                        </div>
                    </div>
                </div>
                <button onClick={() => setCheckInStep('DT')} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    下一步：心理评估 <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    // --- 2.5 DISTRESS THERMOMETER (DT) STEP ---
    if (checkInStep === 'DT') {
        return (
            <div className="max-w-xl mx-auto pt-10 animate-slide-up">
                <button onClick={() => setCheckInStep('VITALS')} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> 返回</button>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">2. 心理痛苦温度计 (DT)</h2>
                    <p className="text-slate-500 text-sm">请圈出您在过去一周内（包括今天）所感受到的心理痛苦程度。</p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg text-center">
                     <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                         <span>无痛苦 (0)</span>
                         <span>极度痛苦 (10)</span>
                     </div>
                     <div className="relative h-64 w-24 mx-auto bg-slate-100 rounded-full border-4 border-white shadow-inner flex items-end justify-center mb-6 overflow-hidden">
                         <div 
                            className={clsx(
                                "w-full transition-all duration-500 ease-out rounded-b-full",
                                dtScore >= 7 ? "bg-red-500" : dtScore >= 4 ? "bg-orange-400" : "bg-green-400"
                            )} 
                            style={{ height: `${dtScore * 10}%` }}
                         />
                         {/* Scale Markers */}
                         <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-30">
                            {[...Array(11)].map((_, i) => <div key={i} className="w-full h-px bg-slate-900"></div>)}
                         </div>
                     </div>
                     
                     <div className="flex items-center justify-center gap-4 mb-4">
                         <button onClick={() => setDtScore(Math.max(0, dtScore - 1))} className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 transition-colors">-</button>
                         <span className={clsx("text-6xl font-bold", dtScore >= 7 ? "text-red-500" : dtScore >= 4 ? "text-orange-500" : "text-green-500")}>{dtScore}</span>
                         <button onClick={() => setDtScore(Math.min(10, dtScore + 1))} className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 transition-colors">+</button>
                     </div>
                     
                     <p className={clsx("font-bold text-sm", dtScore >= 7 ? "text-red-500" : dtScore >= 4 ? "text-orange-500" : "text-green-500")}>
                        {dtScore >= 7 ? "重度痛苦 - 建议寻求专业帮助" : dtScore >= 4 ? "中度痛苦 - 需要关注" : "状态良好"}
                     </p>
                </div>

                <button onClick={() => setCheckInStep('HADS')} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    下一步：详细评估 (HADS) <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    // --- 3. HADS SURVEY STEP ---
    if (checkInStep === 'HADS') {
        const question = HADS_QUESTIONS[currentHadsQuestion];
        const progress = ((currentHadsQuestion + 1) / HADS_QUESTIONS.length) * 100;

        return (
            <div className="max-w-xl mx-auto pt-10 animate-fade-in">
                <button onClick={() => setCheckInStep('DT')} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> 返回</button>
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-xl font-bold text-slate-800">3. 详细心理状态评估 (HADS)</h2>
                        <span className="text-sm text-slate-400 font-mono">{currentHadsQuestion + 1} / {HADS_QUESTIONS.length}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col justify-center">
                    <h3 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed text-center">"{question.text}"</h3>
                    <div className="space-y-3">
                        {question.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleHadsAnswer(question.scores[idx])}
                                className="w-full p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-medium transition-all text-left"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-center mt-6">
                    <button onClick={() => setCheckInStep('SYMPTOMS')} className="text-slate-400 text-sm hover:text-slate-600 underline">跳过此步骤</button>
                </div>
            </div>
        );
    }

    // --- 4. SYMPTOMS STEP ---
    if (checkInStep === 'SYMPTOMS') {
        return (
            <div className="max-w-4xl mx-auto pt-6 animate-fade-in relative pb-20">
                {/* Modal for Body Map / Symptom Detail */}
                {activeBodyPart && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">{activeBodyPart}</span> 
                                不适记录
                            </h3>
                            <button onClick={() => setActiveBodyPart(null)} className="p-2 hover:bg-slate-100 rounded-full"><Plus className="w-5 h-5 text-slate-400 rotate-45" /></button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* 1. Select Symptom */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">选择具体症状</label>
                                <div className="flex flex-wrap gap-2">
                                    {modalSymptoms.map(sym => (
                                        <button
                                            key={sym}
                                            onClick={() => { setSelectedSymptom(sym); setCustomSymptomText(''); }}
                                            className={clsx("px-4 py-2.5 rounded-xl text-sm border transition-all", selectedSymptom === sym ? "bg-indigo-600 border-indigo-600 text-white font-medium shadow-md shadow-indigo-200" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
                                        >
                                            {sym}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setSelectedSymptom('OTHER')}
                                        className={clsx("px-4 py-2.5 rounded-xl text-sm border transition-all", selectedSymptom === 'OTHER' ? "bg-indigo-600 border-indigo-600 text-white font-medium shadow-md shadow-indigo-200" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
                                    >
                                        + 自定义
                                    </button>
                                </div>
                            </div>

                            {/* Custom Input */}
                            {selectedSymptom === 'OTHER' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                                    <input 
                                        type="text" 
                                        placeholder="请输入症状名称 (如: 刺痛、酸胀)" 
                                        value={customSymptomText}
                                        onChange={(e) => setCustomSymptomText(e.target.value)}
                                        className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Details: Severity & Duration (Only show if symptom selected) */}
                            {(selectedSymptom || (selectedSymptom === 'OTHER' && customSymptomText)) && (
                                <div className="space-y-5 pt-2 border-t border-slate-100">
                                    {/* Severity */}
                                    <div className="bg-slate-50 p-5 rounded-2xl">
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="text-slate-500 font-medium flex items-center gap-2"><Zap className="w-4 h-4"/> 严重程度</span>
                                            <span className="font-bold text-indigo-600 text-lg">{symptomSeverity} / 10</span>
                                        </div>
                                        <input type="range" min="1" max="10" value={symptomSeverity} onChange={e => setSymptomSeverity(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg"/>
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                                            <span>轻微不适</span>
                                            <span>难以忍受</span>
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block flex items-center gap-1"><Clock className="w-3 h-3"/> 持续时间</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DURATION_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setSymptomDuration(opt)}
                                                    className={clsx(
                                                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                                        symptomDuration === opt ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                disabled={!selectedSymptom || (selectedSymptom === 'OTHER' && !customSymptomText)} 
                                onClick={confirmSymptom} 
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">4. 身体症状监测</h2>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{patient.currentTreatment}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Quick Select (Smart Prediction) */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" /> 可能出现的反应
                            </h3>
                            <div className="space-y-2">
                                {likelySideEffects.map(effect => {
                                    const isSelected = symptomLog.some(s => s.specificSymptom === effect.name);
                                    return (
                                        <button 
                                            key={effect.id}
                                            onClick={() => toggleQuickSymptom(effect.name)}
                                            className={clsx(
                                                "w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all",
                                                isSelected ? "bg-red-50 border-red-200 text-red-700 font-bold" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            {effect.name}
                                            {isSelected && <CheckCircle className="w-4 h-4 text-red-500" />}
                                        </button>
                                    );
                                })}
                                {likelySideEffects.length === 0 && <p className="text-xs text-slate-400">暂无针对该疗法的特异性预测。</p>}
                            </div>
                        </div>

                        {/* Logged List */}
                        {symptomLog.length > 0 && (
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">已记录</h3>
                                <div className="space-y-2">
                                    {symptomLog.map((s, i) => (
                                        <div key={i} className="flex flex-col bg-slate-50 p-2 px-3 rounded-lg text-sm border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-slate-700">{s.specificSymptom}</span>
                                                <span className={clsx("text-xs px-1.5 py-0.5 rounded font-bold", s.severity >= 7 ? "bg-red-100 text-red-600" : s.severity >= 4 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600")}>
                                                    Lv.{s.severity}
                                                </span>
                                            </div>
                                            {s.duration && <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {s.duration}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Body Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <p className="text-center text-sm text-slate-400 mb-4">点击身体部位，记录详细不适（位置、强度、时间）</p>
                            <BodyMap onPartClick={handleBodyPartClick} selectedParts={symptomLog.map(l => l.bodyPart)} />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
                    <button 
                        onClick={submitCheckIn} 
                        disabled={isGeneratingAdvice}
                        className="bg-indigo-600 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-80 disabled:cursor-wait"
                    >
                        {isGeneratingAdvice ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                AI 正在生成个性化方案...
                            </>
                        ) : (
                            "提交并生成干预方案"
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // --- 5. RESULT VIEW (CARE CENTER) ---
    const lastCheckIn = patient.history.checkIns[patient.history.checkIns.length - 1];
    const hads = lastCheckIn?.hadsResult;
    const currentDT = lastCheckIn?.dtScore ?? 0;

    // Helper for Psych Gauge Color
    const getPsychColor = (level: string) => {
        if (level === 'Normal') return 'text-green-500 bg-green-50 border-green-200';
        if (level === 'Mild') return 'text-yellow-500 bg-yellow-50 border-yellow-200';
        if (level === 'Moderate') return 'text-orange-500 bg-orange-50 border-orange-200';
        return 'text-red-500 bg-red-50 border-red-200';
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
           {/* Header */}
           <div className="flex justify-between items-end mb-8">
              <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                      <HeartPulse className="w-8 h-8 text-indigo-600" /> 康复中心
                  </h2>
                  <p className="text-slate-500">今日干预方案已生成</p>
              </div>
              <button onClick={() => setCheckInStep('INTRO')} className="text-indigo-600 font-semibold text-sm hover:underline flex items-center gap-1">
                 <CalendarCheck className="w-4 h-4" /> 重新打卡
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
               {/* Psych Dashboard */}
               <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> 心理状态仪表盘
                    </h3>
                    
                    {/* DT Score Widget */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium">
                            <span>心理痛苦 (DT)</span>
                            <span className={clsx("px-2 py-0.5 rounded-full text-[10px]", currentDT >= 4 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600")}>
                                {currentDT >= 4 ? "需关注" : "正常"}
                            </span>
                        </div>
                        <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                             <div 
                                className={clsx("h-full rounded-full transition-all duration-1000", currentDT>=7 ? "bg-red-500" : currentDT>=4 ? "bg-orange-500" : "bg-green-500")} 
                                style={{width: `${currentDT * 10}%`}}
                             />
                        </div>
                        <div className="text-3xl font-bold mt-2 text-slate-800">{currentDT}<span className="text-sm text-slate-400 font-normal">/10</span></div>
                    </div>

                    {hads ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className={clsx("p-4 rounded-2xl border text-center", getPsychColor(hads.anxietyLevel))}>
                                <div className="text-3xl font-bold mb-1">{hads.anxietyScore}</div>
                                <div className="text-xs font-bold uppercase opacity-80">焦虑 (A)</div>
                                <div className="text-[10px] mt-2 opacity-60">{hads.anxietyLevel}</div>
                            </div>
                            <div className={clsx("p-4 rounded-2xl border text-center", getPsychColor(hads.depressionLevel))}>
                                <div className="text-3xl font-bold mb-1">{hads.depressionScore}</div>
                                <div className="text-xs font-bold uppercase opacity-80">抑郁 (D)</div>
                                <div className="text-[10px] mt-2 opacity-60">{hads.depressionLevel}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">今日未进行HADS评估</div>
                    )}
               </div>

               {/* Intervention Cards */}
               <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adviceList.length === 0 ? (
                        <div className="col-span-2 bg-green-50 p-8 rounded-3xl border border-green-100 text-center flex flex-col items-center justify-center">
                            <Smile className="w-12 h-12 text-green-500 mb-3" />
                            <h3 className="text-green-800 font-bold text-lg">今日状态平稳</h3>
                            <p className="text-green-600">继续保持良好的生活习惯！</p>
                        </div>
                    ) : (
                        adviceList.map((advice, idx) => {
                            const isPsych = advice.category === 'Psych';
                            const isNutrition = advice.category === 'Nutrition';
                            const isSideEffect = advice.category === 'SideEffect';
                            return (
                                <div key={idx} className={clsx(
                                    "p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:shadow-lg relative overflow-hidden",
                                    isPsych ? "bg-purple-50 border-purple-100" : isNutrition ? "bg-emerald-50 border-emerald-100" : isSideEffect ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100"
                                )}>
                                    <div className="flex items-start justify-between mb-3 relative z-10">
                                        <h3 className={clsx("font-bold text-lg", isPsych ? "text-purple-900" : isNutrition ? "text-emerald-900" : isSideEffect ? "text-blue-900" : "text-slate-800")}>{advice.title}</h3>
                                        {advice.category === 'Nutrition' ? <Utensils className="w-5 h-5 text-emerald-500"/> : 
                                         advice.category === 'Psych' ? <BrainCircuit className="w-5 h-5 text-purple-500"/> : 
                                         <ShieldCheck className="w-5 h-5 text-indigo-500"/>}
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed mb-4 relative z-10 whitespace-pre-wrap">{advice.content}</p>
                                    <div className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1 relative z-10">
                                        <Info className="w-3 h-3" /> 来源: {advice.source}
                                    </div>
                                    {/* Decorative BG icons */}
                                    <div className="absolute -bottom-4 -right-4 text-current opacity-5 transform rotate-12">
                                        {advice.category === 'Nutrition' ? <Utensils className="w-24 h-24"/> : <Activity className="w-24 h-24"/>}
                                    </div>
                                </div>
                            );
                        })
                    )}
               </div>
           </div>
        </div>
    );
  };

  if (activeSection === 'medical-records') return <MedicalRecordModule />;
  return <CareCenterView />;
};

export default PatientDashboard;
