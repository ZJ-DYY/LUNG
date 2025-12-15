import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { analyzeMedicalReport, fileToGenerativePart } from '../services/geminiService';
import { ReportData } from '../types';

interface SmartUploadProps {
  onReportAnalyzed: (data: ReportData) => void;
}

const SmartUpload: React.FC<SmartUploadProps> = ({ onReportAnalyzed }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      const base64Data = await fileToGenerativePart(file);
      const reportData = await analyzeMedicalReport(base64Data, file.type);
      onReportAnalyzed(reportData);
    } catch (error) {
      alert("报告分析失败，请重试。");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" />
        智能报告归档
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        上传您的血液检查或 CT 扫描报告。AI 将自动提取关键指标并生成中文摘要。
      </p>

      <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-indigo-600 font-medium">AI 正在分析报告...</span>
          </div>
        ) : fileName ? (
           <div className="flex flex-col items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-slate-800 font-medium">已分析: {fileName}</span>
            <span className="text-xs text-slate-400 mt-1">点击上传新报告</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-indigo-50 p-3 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-slate-700 font-medium">点击上传图片</span>
            <span className="text-xs text-slate-400 mt-1">支持 JPG, PNG 格式</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartUpload;