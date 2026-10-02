import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { TopicInput } from "./components/TopicInput";
import { StageTabs } from "./components/StageTabs";
import { StageContent } from "./components/StageContent";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import { SourcesReferenceModal } from "./components/SourcesReferenceModal";
import { ReadmeModal } from "./components/ReadmeModal";
import { SiteStatusBar } from "./components/SiteStatusBar";
import { README_MARKDOWN } from "./data/readmeContent";
import {
  StageNumber,
  StageResult,
  CanvasDocument,
} from "./types";
import { STAGES } from "./data/presets";
import { AlertCircle, Sparkles, RefreshCw, RotateCcw } from "lucide-react";
import { safeFetchJson } from "./utils/safeFetch";
import { OriginalQuestionCard } from "./components/OriginalQuestionCard";

export default function App() {
  const [currentUnit, setCurrentUnit] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [customContext, setCustomContext] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMimeType, setImageMimeType] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();

  // Stages State
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<StageNumber>(1);
  const [completedStages, setCompletedStages] = useState<StageNumber[]>([]);
  const [stageResults, setStageResults] = useState<
    Record<StageNumber, StageResult | undefined>
  >({
    1: undefined,
    2: undefined,
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
  });
  const [loadingStage, setLoadingStage] = useState<StageNumber | null>(null);

  // Canvas State
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument | null>(null);
  const [isCanvasView, setIsCanvasView] = useState<boolean>(false);

  // Modal State
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState<boolean>(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<StageNumber | null>(null);

  // Convert Stage 5 or 6 output to structured Canvas document
  const syncToCanvas = async (unitName: string, gradeLevel: string, quizContent: string) => {
    try {
      const res = await safeFetchJson("/api/canvas/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit: unitName,
          grade: gradeLevel,
          quizContent,
        }),
      });
      if (res.ok && res.data?.document && res.data.document.questions) {
        setCanvasDoc(res.data.document);
      }
    } catch (err) {
      console.error("Auto sync to canvas error:", err);
    }
  };

  // Run a specific stage
  const executeStage = async (stageNum: StageNumber) => {
    setErrorMsg(null);
    setFailedStage(null);
    setLoadingStage(stageNum);

    try {
      // Gather previous stages summaries for continuity
      const historySummary = Object.entries(stageResults)
        .filter(([s, r]) => Number(s) < stageNum && r)
        .map(([s, r]) => `【第 ${s} 階段核心分析】：\n${r?.content.slice(0, 500)}...`)
        .join("\n\n");

      const res = await safeFetchJson(
        "/api/diagnose/stage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit: currentUnit,
            grade,
            customContext: `${customContext}\n\n${historySummary ? `【先前階段脈絡】：\n${historySummary}` : ""}`,
            imageBase64,
            imageMimeType,
            fileName,
            stage: stageNum,
          }),
        },
        `階段 ${stageNum} 診斷請求逾時，伺服器正在深度運算中`
      );

      if (!res.ok || !res.data) {
        setFailedStage(stageNum);
        throw new Error(res.error || `階段 ${stageNum} 診斷請求失敗，請點擊右側重新嘗試。`);
      }

      const data = res.data;

      const resolvedGrade = data.effectiveGrade || (grade.includes("自動") ? "國小三年級" : grade);
      const resolvedUnit = data.correctedUnit || currentUnit;

      if (data.effectiveGrade && data.effectiveGrade !== grade) {
        setGrade(data.effectiveGrade);
      }
      if (data.correctedUnit && data.correctedUnit !== currentUnit) {
        setCurrentUnit(data.correctedUnit);
      }

      const newResult: StageResult = {
        stage: stageNum,
        unit: resolvedUnit,
        content: data.content,
        followUps: data.followUps || [],
        userFollowUps: [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setStageResults((prev) => ({
        ...prev,
        [stageNum]: newResult,
      }));

      setCompletedStages((prev) =>
        prev.includes(stageNum) ? prev : [...prev, stageNum]
      );

      setCurrentStage(stageNum);

      const next = (stageNum < 6 ? stageNum + 1 : 6) as StageNumber;
      setMaxUnlockedStage((prev) => (next > prev ? next : prev));

      // If this is stage 5 or 6, also attempt to build the Canvas document
      if (stageNum >= 5) {
        syncToCanvas(resolvedUnit, resolvedGrade, data.content);
      }

      if (stageNum === 6) {
        // Direct to canvas view when stage 6 is triggered
        setIsCanvasView(true);
      }
    } catch (err: any) {
      console.error("Execute stage error:", err);
      setFailedStage(stageNum);
      setErrorMsg(err.message || "診斷過程發生問題，請點擊「重新嘗試」即可繼續。");
    } finally {
      setLoadingStage(null);
    }
  };

  // User starts diagnosis from TopicInput
  const handleStartDiagnosis = async (params: {
    unit: string;
    grade: string;
    customContext: string;
    imageBase64?: string;
    imageMimeType?: string;
    fileName?: string;
  }) => {
    setCurrentUnit(params.unit);
    setGrade(params.grade);
    setCustomContext(params.customContext);
    setImageBase64(params.imageBase64);
    setImageMimeType(params.imageMimeType);
    setFileName(params.fileName);

    // Reset stages
    setCompletedStages([]);
    setMaxUnlockedStage(1);
    setCurrentStage(1);
    setStageResults({
      1: undefined,
      2: undefined,
      3: undefined,
      4: undefined,
      5: undefined,
      6: undefined,
    });
    setCanvasDoc(null);
    setIsCanvasView(false);

    // Trigger Stage 1
    setErrorMsg(null);
    setFailedStage(null);
    setLoadingStage(1);

    try {
      const res = await safeFetchJson(
        "/api/diagnose/stage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit: params.unit,
            grade: params.grade,
            customContext: params.customContext,
            imageBase64: params.imageBase64,
            imageMimeType: params.imageMimeType,
            fileName: params.fileName,
            stage: 1,
          }),
        },
        "階段 1 診斷服務繁忙"
      );

      if (!res.ok || !res.data) {
        setFailedStage(1);
        throw new Error(res.error || "階段 1 診斷請求失敗，請點擊重新嘗試。");
      }

      const data = res.data;

      const finalUnit = data.correctedUnit || data.unit || params.unit;
      if (data.effectiveGrade) {
        setGrade(data.effectiveGrade);
      }
      if (data.correctedUnit || data.unit) {
        setCurrentUnit(finalUnit);
      }

      const newResult: StageResult = {
        stage: 1,
        unit: finalUnit,
        content: data.content,
        followUps: data.followUps || [],
        userFollowUps: [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setStageResults({
        1: newResult,
        2: undefined,
        3: undefined,
        4: undefined,
        5: undefined,
        6: undefined,
      });
      setCompletedStages([1]);
      setMaxUnlockedStage(2);
      setCurrentStage(1);
    } catch (err: any) {
      console.error("Start diagnosis error:", err);
      setFailedStage(1);
      setErrorMsg(err.message || "無法啟動診斷，請點擊重新嘗試。");
    } finally {
      setLoadingStage(null);
    }
  };

  // Submit a follow-up question in the interactive section
  const handleSubmitFollowUp = async (stageNum: StageNumber, question: string) => {
    const currentRes = stageResults[stageNum];
    if (!currentRes) return;

    // Add placeholder question in loading state
    const updatedFollowUps = [
      ...currentRes.userFollowUps,
      { question, isLoading: true },
    ];

    setStageResults((prev) => ({
      ...prev,
      [stageNum]: {
        ...currentRes,
        userFollowUps: updatedFollowUps,
      },
    }));

    try {
      const res = await safeFetchJson(
        "/api/diagnose/stage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit: currentUnit,
            grade,
            customContext: `【當前階段】：第 ${stageNum} 階段\n【本階段專家先前分析摘要】：${currentRes.content.slice(0, 1000)}...`,
            stage: stageNum,
            userFollowUp: question,
          }),
        },
        "追問服務連線逾時"
      );

      if (!res.ok || !res.data) {
        throw new Error(res.error || "追問回覆失敗");
      }

      const data = res.data;

      setStageResults((prev) => {
        const r = prev[stageNum];
        if (!r) return prev;
        const newQAs = r.userFollowUps.map((item) =>
          item.question === question
            ? { question, answer: data.content, isLoading: false }
            : item
        );
        return {
          ...prev,
          [stageNum]: {
            ...r,
            userFollowUps: newQAs,
          },
        };
      });
    } catch (err: any) {
      setStageResults((prev) => {
        const r = prev[stageNum];
        if (!r) return prev;
        const newQAs = r.userFollowUps.map((item) =>
          item.question === question
            ? {
                question,
                answer: `⚠️ 追問連線暫時逾時，請再次點擊即可重新發問！`,
                isLoading: false,
              }
            : item
        );
        return {
          ...prev,
          [stageNum]: { ...r, userFollowUps: newQAs },
        };
      });
    }
  };

  const handleReset = () => {
    setCurrentUnit("");
    setGrade("");
    setCustomContext("");
    setImageBase64(undefined);
    setImageMimeType(undefined);
    setCompletedStages([]);
    setCurrentStage(1);
    setMaxUnlockedStage(1);
    setCanvasDoc(null);
    setIsCanvasView(false);
    setErrorMsg(null);
  };

  const activeResult = stageResults[currentStage];

  // Default canvas doc fallback if auto-sync is still parsing
  const effectiveCanvasDoc: CanvasDocument = canvasDoc || {
    docTitle: `${currentUnit || "數學單元"} - 閱讀理解診斷小考題`,
    grade: grade || "國中八年級",
    school: "國民中學 / 國民小學",
    timeLimit: "20 分鐘",
    totalScore: 100,
    instructions:
      "本測驗非考察複雜運算，旨在檢測題目關鍵字閱讀、圖文轉換與數學語意辨析能力。請仔細閱讀題目敘述，畫出關鍵字再作答。",
    questions: [
      {
        id: "q1",
        number: 1,
        type: "choice",
        score: 25,
        text: `【語意辨析題】：在「${currentUnit}」相關問題中，若題目提到「對稱軸」與「垂直平分線」，下列哪一個學生的理解完全符合數學嚴謹定義？`,
        options: [
          "(A) 垂直平分線一定是線段，長度可以量出來",
          "(B) 對稱軸是一條直線，將圖形摺疊後能完全重合",
          "(C) 任何三角形都恰好有三條對稱軸",
          "(D) 垂直平分線與對稱軸在所有幾何圖形中均完全同義",
        ],
        difficultySource: "字詞的意義不清 (e.g. 對稱軸、垂直平分線)",
        diagnosticNote: "檢測學生是否混淆「線段」與「直線」，以及日常對稱感與幾何對稱軸的差異。",
        distractorAnalysis:
          "(A) 混淆線段與直線；(C) 只有正三角形有三條；(D) 未掌握概念範疇。",
        readingHint: "回想對稱軸的延伸性與幾何摺疊本質。",
        answer: "(B) 正確。對稱軸為直線，且摺疊能完全對合。",
      },
      {
        id: "q2",
        number: 2,
        type: "choice",
        score: 25,
        text: "【圖文表徵轉換題】：小明閱讀題目：「直線 L 垂直平分線段 AB 於 M 點，P 為 L 上任一點」，他打算在草稿紙上作圖，下列哪一個作圖策略最能防止因文字誤讀而導致的解題盲點？",
        options: [
          "(A) 畫出 AB 線段，標記中點 M 與直角符號，並在直線上取異於 M 的點 P 連接 PA 與 PB",
          "(B) 直接將 P 點畫在 M 點上以簡化證明",
          "(C) 隨意畫兩條交叉線，忽略垂直與平分條件",
          "(D) 先代入數字再決定圖形形狀",
        ],
        difficultySource: "缺乏適時使用閱讀策略 (文字轉幾何圖形表徵障礙)",
        diagnosticNote: "檢測學生是否能將文字條件逐一對應至圖形符號 (中點、直角、任意點)。",
        distractorAnalysis: "(B) 誤取特殊點導致喪失一般性；(C) 忽略題意條件。",
        readingHint: "「垂直」與「平分」是兩個獨立的幾何資訊，圖上均需標出記號。",
        answer: "(A) 正確。完整表徵了文字題中的所有條件。",
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900">
      {/* Top Navbar */}
      <Navbar
        currentUnit={currentUnit}
        grade={grade}
        onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
        onOpenReadme={() => setIsReadmeModalOpen(true)}
        onReset={handleReset}
        onOpenCanvasDirectly={() => setIsCanvasView(true)}
        hasCanvasData={completedStages.length > 0}
      />

      {/* Main Container */}
      <main className="flex-1 pb-10">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="max-w-5xl mx-auto mt-4 px-4">
            <div className="p-4 bg-amber-50 border-3 border-[#362723] text-[#362723] text-xs font-bold flex items-center justify-between gap-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(54,39,35,1)]">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#d55734] shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex items-center gap-2">
                {failedStage && (
                  <button
                    type="button"
                    onClick={() => executeStage(failedStage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d55734] hover:bg-[#b84322] text-white font-black text-xs border-2 border-[#362723] rounded-xl shadow-xs cursor-pointer active:translate-y-0.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新嘗試</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setFailedStage(null);
                  }}
                  className="text-[#362723] hover:text-[#d55734] font-black text-sm px-2 py-1 border-2 border-[#362723] bg-white rounded-xl shadow-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {!currentUnit ? (
          /* Step 0: Topic input view */
          <TopicInput
            onStartDiagnosis={handleStartDiagnosis}
            isLoading={loadingStage === 1}
            onOpenReadme={() => setIsReadmeModalOpen(true)}
          />
        ) : isCanvasView ? (
          /* Step 6: Canvas editable workspace view */
          <CanvasWorkspace
            document={effectiveCanvasDoc}
            onUpdateDocument={(newDoc) => setCanvasDoc(newDoc)}
            onBackToStages={() => setIsCanvasView(false)}
          />
        ) : (
          /* Step 1 ~ 5 / 6 Stages Progression view */
          <div>
            <StageTabs
              currentStage={currentStage}
              completedStages={completedStages}
              loadingStage={loadingStage}
              onSelectStage={(s) => {
                if (completedStages.includes(s) || stageResults[s]) {
                  setCurrentStage(s);
                } else if (s <= maxUnlockedStage) {
                  executeStage(s);
                }
              }}
              maxUnlockedStage={maxUnlockedStage}
            />

            {/* Original Question Card with Zoom Feature matching Screenshot 1 */}
            <OriginalQuestionCard
              imageBase64={imageBase64}
              imageMimeType={imageMimeType}
              fileName={fileName}
              unit={currentUnit}
              grade={grade}
              customContext={customContext}
            />

            {loadingStage && !activeResult ? (
              /* Loading Screen for current stage */
              <div className="max-w-lg mx-auto my-24 p-8 bg-white border-4 border-stone-900 rounded-3xl text-center shadow-[12px_12px_0px_0px_rgba(28,25,23,1)]">
                <div className="w-16 h-16 rounded-2xl bg-stone-900 border-2 border-stone-900 flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <div className="inline-block border-2 border-stone-900 px-3 py-1 bg-stone-900 text-white font-black text-xs uppercase italic skew-x-[-10deg] mb-3">
                  PROCESSING STEP 0{loadingStage}
                </div>
                <h3 className="font-black text-stone-900 text-2xl tracking-tight mb-2 uppercase">
                  數學教育專家正在進行
                  <span className="text-blue-600 block mt-1">
                    {STAGES.find((s) => s.number === loadingStage)?.name}
                  </span>
                </h3>
                <p className="text-xs font-bold text-stone-500 leading-relaxed max-w-sm mx-auto">
                  正在比對 7 大閱讀理解困難來源、構建教學維度與代課教師指引中，請稍候片刻。
                </p>
              </div>
            ) : activeResult ? (
              /* Active Stage Result Content with prompt requirement */
              <StageContent
                result={activeResult}
                isLoadingNext={loadingStage !== null}
                onGoToNextStage={(nextNum) => executeStage(nextNum)}
                onSubmitFollowUp={handleSubmitFollowUp}
                onOpenCanvas={() => setIsCanvasView(true)}
                allResults={stageResults}
              />
            ) : null}
          </div>
        )}
      </main>

      {/* Floating Status & Feedback Bar matching user reference */}
      <SiteStatusBar className="sticky bottom-3 z-30 mt-auto mb-3" />

      {/* Slide 7 Difficulties Reference Modal */}
      <SourcesReferenceModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
      />

      {/* README Documentation Modal */}
      <ReadmeModal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
        readmeContent={README_MARKDOWN}
      />
    </div>
  );
}
