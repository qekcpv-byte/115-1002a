import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Upload,
  UploadCloud,
  Clipboard,
  Image as ImageIcon,
  X,
  Compass,
  Calculator,
  Divide,
  Shapes,
  Percent,
  ChevronRight,
  BookOpen,
  Download,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TOPIC_PRESETS } from "../data/presets";
import { MathTopicPreset, UploadedFileMeta } from "../types";
import { README_MARKDOWN } from "../data/readmeContent";
import { copyToClipboard } from "../utils/clipboard";

interface TopicInputProps {
  onStartDiagnosis: (params: {
    unit: string;
    grade: string;
    customContext: string;
    imageBase64?: string;
    imageMimeType?: string;
    fileName?: string;
  }) => void;
  isLoading: boolean;
  onOpenReadme?: () => void;
}

// Helper to infer grade and unit accurately from file name and text content
function inferGradeAndUnit(
  fileName: string,
  textContent?: string
): { detectedUnit: string; detectedGrade: string } {
  const cleanName = fileName
    .replace(/\.(docx|doc|pdf|png|jpg|jpeg|webp|gif|txt|md)$/i, "")
    .replace(/^檔案分析[:：]\s*/, "")
    .trim();
  const sample = `${cleanName} ${textContent || ""}`.toLowerCase();

  let detectedGrade = "自動依教材/檔案內容智能判定";
  let detectedUnit = cleanName;

  // 1. Check 會考 / 基測 / 國中三年級 / 國三 first
  if (
    sample.includes("會考") ||
    sample.includes("基測") ||
    sample.includes("教育會考") ||
    sample.includes("國三") ||
    sample.includes("九年級") ||
    (sample.includes("國中") && sample.includes("三年級"))
  ) {
    detectedGrade = "國中教育會考（九年級）";
    if (
      sample.includes("107") &&
      (sample.includes("#1") || sample.includes("第1題") || sample.includes("第一題") || sample.includes("1題") || sample.includes("對稱"))
    ) {
      detectedUnit = "107數學會考#1（線對稱圖形）";
    }
  } else if (
    sample.includes("垂直平分線") ||
    sample.includes("中垂線") ||
    sample.includes("線對稱") ||
    sample.includes("畢氏定理") ||
    sample.includes("勾股定理") ||
    sample.includes("乘法公式") ||
    sample.includes("八年級") ||
    sample.includes("國二") ||
    (sample.includes("國中") && sample.includes("二年級"))
  ) {
    detectedGrade = "國中八年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = sample.includes("線對稱") ? "線對稱圖形與對稱軸" : "垂直平分線與中垂線性質";
    }
  } else if (
    sample.includes("一元一次") ||
    sample.includes("二元一次") ||
    sample.includes("負數與絕對值") ||
    sample.includes("七年級") ||
    sample.includes("國一") ||
    (sample.includes("國中") && sample.includes("一年級"))
  ) {
    detectedGrade = "國中七年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "一元一次方程式應用";
    }
  } else if (sample.includes("相似形") || sample.includes("二次函數")) {
    detectedGrade = "國中九年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "相似形與幾何推理";
    }
  } else if (
    sample.includes("三角函數") ||
    sample.includes("多項式") ||
    sample.includes("高中") ||
    sample.includes("學測") ||
    sample.includes("分科")
  ) {
    detectedGrade = "高中十年級";
  } else if (
    sample.includes("萬以內的數") ||
    sample.includes("千以內的數") ||
    sample.includes("百以內的數") ||
    sample.includes("四位數") ||
    sample.includes("定位板") ||
    (sample.includes("國小") && sample.includes("三年級")) ||
    (!sample.includes("國中") && !sample.includes("高中") && (sample.includes("三年級") || sample.includes("中年級")))
  ) {
    detectedGrade = "國小三年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "萬以內的數";
    }
  } else if (sample.includes("10以內的數") || sample.includes("20以內的數") || (sample.includes("國小") && sample.includes("一年級"))) {
    detectedGrade = "國小一年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "10以內的數與加減";
    }
  } else if (sample.includes("乘法") && (sample.includes("九九") || sample.includes("二位數") || (sample.includes("國小") && sample.includes("二年級")))) {
    detectedGrade = "國小二年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "乘法概念與應用";
    }
  } else if (sample.includes("概數") || sample.includes("億以內的數") || (sample.includes("國小") && sample.includes("四年級"))) {
    detectedGrade = "國小四年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "概數與大數計算";
    }
  } else if (sample.includes("因數") || sample.includes("倍數") || sample.includes("異分母") || (sample.includes("國小") && sample.includes("五年級"))) {
    detectedGrade = "國小五年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "因數與倍數概念";
    }
  } else if (sample.includes("基準量") || sample.includes("比較量") || sample.includes("比與比值") || (sample.includes("國小") && sample.includes("六年級"))) {
    detectedGrade = "國小六年級";
    if (!detectedUnit || detectedUnit.startsWith("檔案分析")) {
      detectedUnit = "基準量與比較量";
    }
  }

  return { detectedUnit, detectedGrade };
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Compass: <Compass className="w-5 h-5 text-indigo-600" />,
  Calculator: <Calculator className="w-5 h-5 text-emerald-600" />,
  Divide: <Divide className="w-5 h-5 text-amber-600" />,
  Shapes: <Shapes className="w-5 h-5 text-purple-600" />,
  Percent: <Percent className="w-5 h-5 text-sky-600" />,
};

export const TopicInput: React.FC<TopicInputProps> = ({
  onStartDiagnosis,
  isLoading,
  onOpenReadme,
}) => {
  const [unit, setUnit] = useState("");
  const [grade, setGrade] = useState("自動依教材/檔案內容智能判定");
  const [customContext, setCustomContext] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMimeType, setImageMimeType] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState<boolean>(false);
  const [isReadmeExpanded, setIsReadmeExpanded] = useState<boolean>(false);
  const [copiedReadme, setCopiedReadme] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File, fallbackName?: string) => {
    try {
      const fileName = file.name || fallbackName || "uploaded_file";
      const lowerName = fileName.toLowerCase();
      const isDocx =
        lowerName.endsWith(".docx") ||
        lowerName.endsWith(".doc") ||
        file.type.includes("word") ||
        file.type.includes("officedocument");
      const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
      const isText =
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        file.type.startsWith("text/");
      const isImage =
        file.type.startsWith("image/") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".webp") ||
        lowerName.endsWith(".gif");

      let fileType: "image" | "pdf" | "docx" | "text" | "other" = "other";
      if (isImage) fileType = "image";
      else if (isPdf) fileType = "pdf";
      else if (isDocx) fileType = "docx";
      else if (isText) fileType = "text";

      const effectiveMime =
        file.type ||
        (isPdf
          ? "application/pdf"
          : isDocx
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : isText
          ? "text/plain"
          : "image/png");

      const reader = new FileReader();
      reader.onerror = (e) => {
        console.warn("FileReader error:", e);
      };
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64Data = result ? result.split(",")[1] : "";

          setImageBase64(base64Data);
          setImageMimeType(effectiveMime);

          if (isImage) {
            setImagePreview(result);
          } else {
            setImagePreview(null);
          }

          const meta: UploadedFileMeta = {
            base64: base64Data,
            mimeType: effectiveMime,
            name: fileName,
            size: file.size,
            type: fileType,
            previewUrl: isImage ? result : undefined,
          };

          // If Word or Text, parse text from server for instant preview
          let serverParsedText = "";
          if (isDocx || isText) {
            setIsParsingDoc(true);
            try {
              const parseRes = await fetch("/api/upload/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileBase64: base64Data,
                  fileName,
                  mimeType: effectiveMime,
                }),
              });
              if (parseRes.ok) {
                const parsedData = await parseRes.json();
                meta.extractedText = parsedData.text;
                serverParsedText = parsedData.text || "";
                if (parsedData.suggestedUnit) {
                  setUnit(parsedData.suggestedUnit);
                }
                if (parsedData.detectedGrade && parsedData.detectedGrade !== "自動依教材/檔案內容智能判定") {
                  setGrade(parsedData.detectedGrade);
                }
              }
            } catch (err) {
              console.warn("Parse file error:", err);
            } finally {
              setIsParsingDoc(false);
            }
          }

          // Infer grade and unit accurately from file name and extracted text
          const inferred = inferGradeAndUnit(fileName, serverParsedText);
          if (inferred.detectedUnit && (!unit || unit.startsWith("檔案分析：") || unit.includes("垂直平分線"))) {
            setUnit(inferred.detectedUnit);
          }
          if (inferred.detectedGrade && inferred.detectedGrade !== "自動依教材/檔案內容智能判定") {
            setGrade(inferred.detectedGrade);
          }

          setUploadedFile(meta);
          const displayGrade = inferred.detectedGrade !== "自動依教材/檔案內容智能判定" ? inferred.detectedGrade : "";
          const gradeNotice = displayGrade ? ` · 智能校準學段為「${displayGrade}」` : "";
          setPasteNotice(`✅ 已成功載入「${fileName}」${gradeNotice}`);
          setTimeout(() => setPasteNotice(null), 4000);
        } catch (readErr) {
          console.warn("Error processing file reader result:", readErr);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("processFile error:", err);
    }
  };

  // Read from clipboard via button
  const handlePasteFromClipboardButton = async () => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const file = new File([blob], `剪貼簿截圖_${Date.now()}.png`, { type });
              processFile(file);
              setPasteNotice("📋 已成功貼上剪貼簿中的截圖！");
              setTimeout(() => setPasteNotice(null), 3500);
              return;
            }
          }
        }
      }
      // Fallback to text reading
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const file = new File([text], `剪貼簿題目文字_${Date.now()}.txt`, { type: "text/plain" });
        processFile(file);
        setPasteNotice("📋 已成功貼上剪貼簿中的題目文字！");
        setTimeout(() => setPasteNotice(null), 3500);
      } else {
        setPasteNotice("💡 剪貼簿中目前沒有可讀取的內容，請先複製圖片、檔案或文字。");
        setTimeout(() => setPasteNotice(null), 3500);
      }
    } catch (err) {
      console.warn("Clipboard read error:", err);
      setPasteNotice("💡 請直接在頁面上按下鍵盤快捷鍵 Ctrl + V 即可貼上！");
      setTimeout(() => setPasteNotice(null), 3500);
    }
  };

  // Global Ctrl + V / Cmd + V paste listener for instant screenshot, files, or text
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 1. Check if files exist in clipboard (e.g. copied from file explorer or screenshot)
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        e.preventDefault();
        processFile(file, file.name);
        setPasteNotice(`📋 已成功透過 Ctrl+V 貼上檔案「${file.name}」！`);
        setTimeout(() => setPasteNotice(null), 3500);
        return;
      }

      // 2. Check clipboard items for images
      const items = e.clipboardData?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const timeStr = new Date().toLocaleTimeString().replace(/:/g, "");
              processFile(file, `剪貼簿截圖_${timeStr}.png`);
              setPasteNotice("📋 已成功透過 Ctrl+V 貼上剪貼簿截圖！");
              setTimeout(() => setPasteNotice(null), 3500);
              return;
            }
          }
        }
      }

      // 3. If user pasted text and is not currently typing inside input or textarea
      const target = e.target as HTMLElement;
      const isTypingInField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (!isTypingInField) {
        const text = e.clipboardData?.getData("text");
        if (text && text.trim().length > 0) {
          e.preventDefault();
          const file = new File([text], `剪貼簿題目內容_${Date.now()}.txt`, {
            type: "text/plain",
          });
          processFile(file);
          setPasteNotice("📋 已成功透過 Ctrl+V 載入剪貼簿題目文字！");
          setTimeout(() => setPasteNotice(null), 3500);
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  const handleCopyReadme = async () => {
    const success = await copyToClipboard(README_MARKDOWN);
    if (success) {
      setCopiedReadme(true);
      setTimeout(() => setCopiedReadme(false), 2000);
    }
  };

  const handleDownloadReadme = () => {
    const blob = new Blob([README_MARKDOWN], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "README.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectPreset = (preset: MathTopicPreset) => {
    setUnit(preset.title);
    setGrade(preset.grade);
    setCustomContext(`【教學情境聚焦】：${preset.desc}\n【經典易錯實例】：${preset.sampleProblems}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleClearFile = () => {
    setImagePreview(null);
    setImageBase64(undefined);
    setImageMimeType(undefined);
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit.trim() && !imageBase64 && !uploadedFile) return;

    let finalContext = customContext;
    if (uploadedFile?.extractedText) {
      finalContext = `${customContext}\n\n【上傳檔案（${uploadedFile.name}）文字內容】：\n${uploadedFile.extractedText}`.trim();
    }

    const cleanFileNameUnit = uploadedFile?.name
      ? uploadedFile.name
          .replace(/\.(docx|doc|pdf|png|jpg|jpeg|webp|gif|txt|md)$/i, "")
          .replace(/^檔案分析[:：]\s*/, "")
          .trim()
      : "";

    const effectiveUnit = unit.trim() || cleanFileNameUnit || "數學閱讀理解單元";

    onStartDiagnosis({
      unit: effectiveUnit,
      grade,
      customContext: finalContext,
      imageBase64: uploadedFile?.base64 || imageBase64,
      imageMimeType: uploadedFile?.mimeType || imageMimeType,
      fileName: uploadedFile?.name,
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Main Operation Area */}
      <div className="relative mt-4 mb-10">
        {/* Attached pill badge centered on top border */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-[#d55734] text-white font-black text-xs sm:text-sm rounded-full border-2 border-[#362723] shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] flex items-center gap-1.5 z-10 whitespace-nowrap select-none">
          <span>👇</span>
          <span>主要操作區在此</span>
          <span>👇</span>
        </div>

        {/* Main Card Body */}
        <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl p-6 sm:p-9 shadow-[6px_6px_0px_0px_rgba(54,39,35,1)] relative pt-9 sm:pt-10">
          {/* Decorative yellow circle in upper-right corner */}
          <div className="absolute top-6 right-6 w-6 h-6 rounded-full bg-[#f6be44] border-2 border-[#362723] select-none" />

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl font-black text-center text-[#362723] tracking-tight mb-4">
            數學閱讀理解分析小幫手
          </h2>

          {/* Subtitle box */}
          <div className="max-w-3xl mx-auto bg-[#fbf8ee] border-2 border-[#362723]/20 rounded-2xl p-4 sm:p-6 text-center mb-8">
            <p className="text-sm sm:text-base font-bold text-[#362723] mb-3">
              把數學題目拍下來、上傳檔案或貼上，讓我來幫你分析！
            </p>
            {/* The 3 Feature Boxes Aligned with the Operation Manual - Streamlined */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-white border-2 border-[#362723]/30 rounded-2xl p-3.5 shadow-xs hover:border-[#d55734] transition-colors">
                <div className="flex items-center gap-2 mb-1 text-[#d55734] font-black text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-[#d55734] flex items-center justify-center text-xs shrink-0 font-black">
                    1
                  </span>
                  <span>7大閱讀困難來源</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#362723]/80 font-bold leading-relaxed">
                  剖析專用語詞、語意衝突、先備知識與邏輯等學生思維障礙。
                </p>
              </div>

              <div className="bg-white border-2 border-[#362723]/30 rounded-2xl p-3.5 shadow-xs hover:border-[#d55734] transition-colors">
                <div className="flex items-center gap-2 mb-1 text-[#d55734] font-black text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs shrink-0 font-black">
                    2
                  </span>
                  <span>三維度教學與教案</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#362723]/80 font-bold leading-relaxed">
                  提供解碼、整合與策略鷹架，以及代課教師 20 分鐘口語腳本。
                </p>
              </div>

              <div className="bg-white border-2 border-[#362723]/30 rounded-2xl p-3.5 shadow-xs hover:border-[#d55734] transition-colors">
                <div className="flex items-center gap-2 mb-1 text-[#d55734] font-black text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs shrink-0 font-black">
                    3
                  </span>
                  <span>診斷考題與Canvas</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#362723]/80 font-bold leading-relaxed">
                  設計精準試題與誘答剖析，支援 Canvas 線上編輯與匯出列印。
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black tracking-wider text-[#362723] mb-2">
                  數學主題 / 題目描述 <span className="text-[#d55734]">*</span>
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUnit(val);
                    if (
                      grade === "自動依教材/檔案內容智能判定" ||
                      (grade.startsWith("國小") && (val.includes("會考") || val.includes("國中") || val.includes("垂直平分線")))
                    ) {
                      const inferred = inferGradeAndUnit("", `${val} ${customContext}`);
                      if (inferred.detectedGrade && inferred.detectedGrade !== "自動依教材/檔案內容智能判定") {
                        setGrade(inferred.detectedGrade);
                      }
                    }
                  }}
                  placeholder="例如：107數學會考#1（線對稱圖形）、國中八年級垂直平分線與對稱軸..."
                  className="w-full px-4 py-3 border-2 border-[#362723] rounded-2xl font-bold text-sm outline-none bg-[#fbf8ee] focus:bg-white focus:border-[#d55734] focus:shadow-[3px_3px_0px_0px_rgba(213,87,52,1)] transition-all placeholder:text-gray-400 text-[#362723]"
                  required={!imageBase64}
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider text-[#362723] mb-2">
                  適用年級 / 學段
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#362723] rounded-2xl font-bold text-sm outline-none bg-[#fbf8ee] focus:bg-white text-[#362723] transition-all cursor-pointer"
                >
                  <option value="自動依教材/檔案內容智能判定">🌟 自動依教材/檔案內容智能判定 (推薦)</option>
                  <option value="國小一年級">國小一年級</option>
                  <option value="國小二年級">國小二年級</option>
                  <option value="國小三年級">國小三年級</option>
                  <option value="國小四年級">國小四年級</option>
                  <option value="國小五年級">國小五年級</option>
                  <option value="國小六年級">國小六年級</option>
                  <option value="國中七年級">國中七年級 (國一)</option>
                  <option value="國中八年級">國中八年級 (國二)</option>
                  <option value="國中九年級">國中九年級 (國三)</option>
                  <option value="高中十年級">高中十年級 (高一)</option>
                  <option value="高中十一年級">高中十一年級 (高二)</option>
                  <option value="高中十二年級">高中十二年級 (高三)</option>
                </select>
              </div>
            </div>

            {/* Context / Error notes */}
            <div>
              <label className="block text-xs font-black tracking-wider text-[#362723] mb-2">
                補充說明 / 學生常見錯題原因與閱讀迷思 (選填)
              </label>
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={3}
                placeholder="可貼上題幹原文、題目文字、學生容易誤解或選錯的誘答選項（例如：「學生常把打七折誤為減去 70%」、「看到『比原價多...』就抓錯基準量」）..."
                className="w-full px-4 py-3 border-2 border-[#362723] rounded-2xl font-bold text-sm outline-none bg-[#fbf8ee] focus:bg-white focus:border-[#d55734] focus:shadow-[3px_3px_0px_0px_rgba(213,87,52,1)] transition-all placeholder:text-gray-400 text-[#362723] resize-none"
              />
            </div>

            {/* Multimodal Upload & Paste Area (Enlarged) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black tracking-wider text-[#362723]">
                  教材與題目多模態檔案 (選填 · 支援試卷照片、PDF講義、Word教案、純文字)
                </label>
                <span className="text-[11px] font-bold text-[#d55734] flex items-center gap-1">
                  <span>💡 支援鍵盤</span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#362723]/30 rounded text-[10px] font-mono font-black shadow-2xs">Ctrl + V</kbd>
                  <span>直接貼上截圖</span>
                </span>
              </div>

              {/* Toast banner for paste or upload */}
              {pasteNotice && (
                <div className="mb-3 px-4 py-2.5 bg-emerald-50 border-2 border-emerald-600 rounded-2xl text-xs font-black text-emerald-950 flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{pasteNotice}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPasteNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
                id="topic-multimodal-upload"
              />

              {!uploadedFile ? (
                /* Enlarged Dropzone & Paste Area */
                <label
                  htmlFor="topic-multimodal-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      processFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`block w-full border-3 border-dashed ${
                    isDragging
                      ? "border-[#d55734] bg-amber-100/80 scale-[1.01]"
                      : "border-[#362723]/40 bg-[#fdfaf3] hover:bg-[#fff9ef] hover:border-[#d55734]"
                  } rounded-3xl p-8 sm:p-11 text-center cursor-pointer transition-all shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] group`}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-[#362723] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-[#d55734]" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#362723] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] text-[#d55734]">
                        <Clipboard className="w-6 h-6" />
                      </div>
                    </div>

                    <div>
                      <p className="text-base sm:text-lg font-black text-[#362723] group-hover:text-[#d55734] transition-colors">
                        點擊此處選擇檔案、將檔案拖曳至此，或直接按下{" "}
                        <kbd className="px-2.5 py-1 bg-white border-2 border-[#362723]/40 rounded-xl text-sm font-mono font-black text-[#d55734] shadow-xs">
                          Ctrl + V
                        </kbd>{" "}
                        快速貼上
                      </p>
                      <p className="text-xs sm:text-sm text-[#362723]/70 font-bold mt-2">
                        全面支援多模態：題目截圖 (PNG/JPG)、PDF 講義試卷、Word 考卷教案 (.docx, .doc)、純文字檔
                      </p>
                    </div>

                    {/* Quick paste button inside dropzone */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePasteFromClipboardButton();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-amber-100 text-[#362723] border-2 border-[#362723] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Clipboard className="w-4 h-4 text-[#d55734]" />
                        <span>📋 點我貼上剪貼簿內容</span>
                      </button>
                    </div>

                    {/* Supported modality badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] sm:text-xs font-bold text-[#362723]">
                      <span className="px-3 py-1 bg-white border border-[#362723]/20 rounded-xl shadow-2xs flex items-center gap-1.5">
                        <span>🖼️</span> 題目照片 / 截圖 (PNG/JPG)
                      </span>
                      <span className="px-3 py-1 bg-white border border-[#362723]/20 rounded-xl shadow-2xs flex items-center gap-1.5">
                        <span>📑</span> PDF 考卷 / 講義 (.pdf)
                      </span>
                      <span className="px-3 py-1 bg-white border border-[#362723]/20 rounded-xl shadow-2xs flex items-center gap-1.5">
                        <span>📝</span> Word 文件 (.docx, .doc)
                      </span>
                      <span className="px-3 py-1 bg-white border border-[#362723]/20 rounded-xl shadow-2xs flex items-center gap-1.5">
                        <span>📄</span> 純文字題幹 (.txt, .md)
                      </span>
                      <span className="px-3 py-1 bg-[#fff3e0] text-[#d55734] border border-[#d55734]/40 rounded-xl shadow-2xs flex items-center gap-1.5 font-black">
                        <span>⚡</span> Ctrl + V 剪貼簿快速貼上
                      </span>
                    </div>
                  </div>
                </label>
              ) : (
                /* Enlarged Active File Preview Card */
                <div className="w-full border-2 border-[#362723] bg-white rounded-3xl p-5 sm:p-6 shadow-[3px_3px_0px_0px_rgba(54,39,35,1)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Thumbnail or File Icon */}
                      {uploadedFile.type === "image" && uploadedFile.previewUrl ? (
                        <div className="relative w-20 h-20 rounded-2xl border-2 border-[#362723] overflow-hidden bg-gray-50 shrink-0 shadow-2xs">
                          <img
                            src={uploadedFile.previewUrl}
                            alt="Uploaded Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : uploadedFile.type === "pdf" ? (
                        <div className="w-16 h-16 rounded-2xl bg-red-100 border-2 border-[#362723] flex flex-col items-center justify-center shrink-0 shadow-2xs text-red-700">
                          <FileText className="w-7 h-7" />
                          <span className="text-[10px] font-black uppercase">PDF</span>
                        </div>
                      ) : uploadedFile.type === "docx" ? (
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-[#362723] flex flex-col items-center justify-center shrink-0 shadow-2xs text-blue-700">
                          <FileText className="w-7 h-7" />
                          <span className="text-[10px] font-black uppercase">DOCX</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-[#362723] flex flex-col items-center justify-center shrink-0 shadow-2xs text-amber-800">
                          <FileText className="w-7 h-7" />
                          <span className="text-[10px] font-black uppercase">TXT</span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-[#362723] truncate max-w-xs sm:max-w-md">
                            {uploadedFile.name}
                          </h4>
                          {uploadedFile.size && (
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {formatFileSize(uploadedFile.size)}
                            </span>
                          )}
                        </div>

                        {/* Modality tag */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {uploadedFile.type === "image" && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>🖼️</span> 題目圖片已就緒 · 支援視覺公式辨識
                            </span>
                          )}
                          {uploadedFile.type === "pdf" && (
                            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>📑</span> PDF 試卷已就緒 · 原生多頁圖文辨識
                            </span>
                          )}
                          {uploadedFile.type === "docx" && (
                            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>📝</span> Word 文件已就緒
                              {isParsingDoc
                                ? " (解析文字中...)"
                                : uploadedFile.extractedText
                                ? ` · 已提取 ${uploadedFile.extractedText.length} 字`
                                : ""}
                            </span>
                          )}
                          {uploadedFile.type === "text" && (
                            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>📄</span> 純文字檔案已就緒
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-bold text-gray-400 mt-1">
                          💡 隨時按下鍵盤 <kbd className="font-mono text-gray-600">Ctrl + V</kbd> 可立即以新截圖替換
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      <label
                        htmlFor="topic-multimodal-upload"
                        className="px-3.5 py-2 bg-[#fbf8ee] hover:bg-amber-100/70 border-2 border-[#362723] rounded-xl text-xs font-black text-[#362723] cursor-pointer transition-all shadow-xs"
                      >
                        更換檔案
                      </label>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-700 hover:text-rose-900 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>移除</span>
                      </button>
                    </div>
                  </div>

                  {/* Snippet preview for parsed Word/Text */}
                  {uploadedFile.extractedText && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-[#362723] flex items-center gap-1.5">
                          <span>🔍</span> 文件文字提取預覽：
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">
                          共 {uploadedFile.extractedText.length} 字
                        </span>
                      </div>
                      <div className="max-h-24 overflow-y-auto bg-[#fbf8ee] p-2.5 rounded-xl border border-[#362723]/20 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap select-text">
                        {uploadedFile.extractedText.slice(0, 400)}
                        {uploadedFile.extractedText.length > 400 && "..."}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isLoading || (!unit.trim() && !imageBase64 && !uploadedFile)}
                className="w-full sm:w-auto px-8 py-4 bg-[#d55734] hover:bg-[#bd4726] text-white font-black text-sm tracking-wider rounded-2xl border-2 border-[#362723] shadow-[4px_4px_0px_0px_rgba(54,39,35,1)] hover:shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>數學閱讀理解分析小幫手正在為您深入診斷中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>開始診斷分析 (進入第 1 階段)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preset Topics Quick Selector */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-4 border-b-2 border-[#362723]/30 pb-2">
          <h3 className="text-lg font-black tracking-tight text-[#362723] flex items-center gap-2">
            <span className="text-xl">📌</span>
            <span>推薦經典診斷主題（點擊快速帶入）：</span>
          </h3>
          <span className="text-xs font-bold text-[#362723]/70 tracking-wider">
            常見閱讀與解題卡關單元
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPIC_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="text-left p-4 bg-[#fffef7] hover:bg-amber-50/70 border-2 border-[#362723] rounded-2xl shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] hover:shadow-[4px_4px_0px_0px_rgba(213,87,52,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border-2 border-[#362723] flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    {ICON_MAP[p.iconName] || <BookOpen className="w-4 h-4 text-[#d55734]" />}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 border border-[#362723] bg-[#fbf8ee] text-[#362723] font-bold rounded-full">
                    {p.grade}
                  </span>
                </div>
                <h4 className="font-black text-[#362723] text-base group-hover:text-[#d55734] transition-colors line-clamp-1">
                  {p.title}
                </h4>
                <p className="text-xs font-medium text-[#362723]/80 mt-1 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#362723]/20 flex items-center text-xs font-black text-[#d55734] group-hover:translate-x-1 transition-transform">
                <span>選擇此主題分析</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Homepage README Section */}
      <section className="mt-10 bg-[#fffef7] border-4 border-[#362723] rounded-3xl shadow-[5px_5px_0px_0px_rgba(54,39,35,1)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#362723]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-200 border-2 border-[#362723] flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] shrink-0">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-[#d55734] text-white rounded-full border border-[#362723] shadow-xs">
                  README.md
                </span>
                <span className="text-xs font-bold text-[#362723]/80">
                  系統設計架構與使用手冊 (優履工作室研發)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-[#362723] mt-0.5">
                數學閱讀理解困難診斷 · 官方設計指引
              </h3>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {onOpenReadme && (
              <button
                type="button"
                onClick={onOpenReadme}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-[#d55734] hover:bg-[#bd4726] border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="彈窗閱讀完整 README"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-200" />
                <span>彈窗全覽</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadReadme}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="下載 README.md 檔案"
            >
              <Download className="w-3.5 h-3.5 text-[#d55734]" />
              <span>下載檔案</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReadme}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="複製全文 Markdown"
            >
              {copiedReadme ? (
                <Check className="w-3.5 h-3.5 text-[#d55734]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#362723]" />
              )}
              <span>{copiedReadme ? "已複製" : "複製全文"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReadmeExpanded(!isReadmeExpanded)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-white hover:bg-amber-50 border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              {isReadmeExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#362723]" />
                  <span>收起內文</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-[#362723]" />
                  <span>首頁展開閱讀</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Readme Highlight Cards */}
        {!isReadmeExpanded ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#fbf8ee] border-2 border-[#362723]/30 rounded-2xl">
              <div className="flex items-center gap-2 text-[#362723] font-black text-sm mb-2">
                <span>🔍</span>
                <span>7 大數學閱讀困難</span>
              </div>
              <ul className="text-xs text-[#362723]/90 space-y-1.5 font-medium leading-relaxed">
                <li>• 01. 忽略文本細節與圖形符號</li>
                <li>• 02. 專用字詞與日常語意混淆</li>
                <li>• 03. 生活經驗與情境轉譯脫節</li>
                <li>• 04. 缺乏劃線與畫圖等閱讀策略</li>
                <li>• 05. 概念不清楚導致文本理解錯誤</li>
                <li>• 06. 雜訊過多難抓關鍵已知量</li>
                <li>• 07. 複雜複合句型造成記憶斷裂</li>
              </ul>
            </div>

            <div className="p-4 bg-[#fbf8ee] border-2 border-[#362723]/30 rounded-2xl">
              <div className="flex items-center gap-2 text-[#362723] font-black text-sm mb-2">
                <span>📐</span>
                <span>6 階段試題診斷流程</span>
              </div>
              <ul className="text-xs text-[#362723]/90 space-y-1.5 font-medium leading-relaxed">
                <li>• 01. 單元閱讀困難映射與實例</li>
                <li>• 02. 理解、轉譯、策略三維度設計</li>
                <li>• 03. 子概念與困難維度分類矩陣</li>
                <li>• 04. 20 分鐘代課教師即用教案</li>
                <li>• 05. 閱讀理解診斷小考題命題</li>
                <li>• 06. Canvas 試卷排版 (學生/教師卷)</li>
              </ul>
            </div>

            <div className="p-4 bg-[#fbf8ee] border-2 border-[#362723]/30 rounded-2xl">
              <div className="flex items-center gap-2 text-[#362723] font-black text-sm mb-2">
                <span>🧭</span>
                <span>波利亞解題思維融入</span>
              </div>
              <ul className="text-xs text-[#362723]/90 space-y-1.5 font-medium leading-relaxed">
                <li>• <strong>理解題目</strong>：圈出已知、限制與目標</li>
                <li>• <strong>擬定計畫</strong>：建立數線、幾何草圖表徵</li>
                <li>• <strong>執行計畫</strong>：每一步嚴謹對齊數學定義</li>
                <li>• <strong>回顧反思</strong>：反思文字題型特徵與陷阱</li>
                <li className="pt-1 text-[#d55734] font-bold">
                  ★ 支援一鍵送印與 Word (.doc) 離線匯出
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Expanded Full README View directly on homepage */
          <div className="mt-5 p-5 sm:p-7 bg-white border-2 border-[#362723] rounded-2xl shadow-inner max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={README_MARKDOWN} />
          </div>
        )}
      </section>
    </div>
  );
};
