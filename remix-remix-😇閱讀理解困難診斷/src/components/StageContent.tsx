import React, { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Copy,
  Check,
  Printer,
  ChevronRight,
  FileEdit,
  Send,
  Loader2,
  Share2,
} from "lucide-react";
import { StageResult, StageNumber, FollowUpItem } from "../types";
import { STAGES } from "../data/presets";
import { copyToClipboard } from "../utils/clipboard";

interface StageContentProps {
  result: StageResult;
  isLoadingNext: boolean;
  onGoToNextStage: (nextStageNum: StageNumber) => void;
  onSubmitFollowUp: (stageNum: StageNumber, question: string) => Promise<void>;
  onOpenCanvas: () => void;
  allResults: Record<StageNumber, StageResult | undefined>;
}

export const StageContent: React.FC<StageContentProps> = ({
  result,
  isLoadingNext,
  onGoToNextStage,
  onSubmitFollowUp,
  onOpenCanvas,
}) => {
  const [customQuestion, setCustomQuestion] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const currentStageMeta = STAGES.find((s) => s.number === result.stage);
  const nextStageNum = (result.stage < 6 ? result.stage + 1 : null) as StageNumber | null;
  const nextStageMeta = nextStageNum ? STAGES.find((s) => s.number === nextStageNum) : null;

  const handleCopy = async () => {
    const success = await copyToClipboard(result.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickFollowUp = async (question: string) => {
    setIsAsking(true);
    await onSubmitFollowUp(result.stage, question);
    setIsAsking(false);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;
    const q = customQuestion.trim();
    setCustomQuestion("");
    setIsAsking(true);
    await onSubmitFollowUp(result.stage, q);
    setIsAsking(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Top Banner with Title, Meta, and Action buttons */}
      <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_rgba(54,39,35,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <div className="border-2 border-[#362723] px-3 py-0.5 bg-[#d55734] text-white font-black text-xs rounded-full shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] flex items-center gap-1">
              <span>🎯</span>
              <span>第 0{result.stage} 階段</span>
            </div>
            <span className="text-xs font-bold px-3 py-0.5 bg-[#fbf8ee] text-[#362723] border border-[#362723] rounded-full">
              單元：{result.unit}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#362723]">
            {currentStageMeta?.name}
          </h2>
          <p className="text-xs font-bold text-[#362723]/80 tracking-wide mt-1">
            {currentStageMeta?.desc}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="複製本階段診斷內容"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#d55734]" />
                <span>已複製</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#362723]" />
                <span>複製文字</span>
              </>
            )}
          </button>

          {result.stage >= 5 && (
            <button
              onClick={onOpenCanvas}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#d55734] hover:bg-[#bd4726] border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <FileEdit className="w-4 h-4 text-amber-200" />
              <span>Canvas 試卷排版</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Markdown Content Area */}
      <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl p-7 sm:p-9 shadow-[5px_5px_0px_0px_rgba(54,39,35,1)]">
        <div className="prose max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-[#362723] prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-[#362723]/20 prose-h2:pb-2 prose-h3:text-lg prose-h3:text-[#d55734] text-sm sm:text-base leading-relaxed text-[#362723]">
          <MarkdownRenderer content={result.content} />
        </div>
      </div>

      {/* Interactive Follow-up & Next Stage Dialog */}
      <div className="bg-[#362723] text-amber-50 border-4 border-[#362723] rounded-3xl p-7 sm:p-9 shadow-[6px_6px_0px_0px_rgba(213,87,52,1)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#d55734] text-white flex items-center justify-center shrink-0 font-black text-xl border-2 border-white/30 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)]">
              💡
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                教學引導中繼站
              </h3>
              <p className="text-xs font-bold text-amber-200/80 tracking-wide mt-0.5">
                診斷檢核 · 停下來確認是否有需要深入追問或調整的事項？
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 border border-amber-600/60 px-3 py-1 bg-amber-900/60 text-amber-200 text-xs font-bold rounded-full self-start sm:self-center">
            <span>🎯</span>
            <span>第 0{result.stage} 階段分析完成</span>
          </div>
        </div>

        {/* Suggested 2 Follow-ups */}
        <div className="space-y-3">
          <p className="text-xs font-black tracking-wide text-amber-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#d55734]" />
            <span>推薦深入追問（點擊直接發問）：</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.followUps.map((fu, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isAsking}
                onClick={() => handleQuickFollowUp(fu)}
                className="text-left p-4 bg-white/10 hover:bg-white/15 border-2 border-amber-600/40 hover:border-amber-300 rounded-2xl transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
              >
                <span className="w-5 text-xs font-black text-amber-300 pt-0.5">
                  0{idx + 1}
                </span>
                <span className="flex-1 text-xs sm:text-sm font-bold text-amber-50 group-hover:text-amber-200 leading-snug transition-colors">
                  {fu}
                </span>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-200 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Follow-up input form */}
        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2">
          <label className="block text-xs font-black tracking-wide text-amber-200">
            或輸入自訂追問 / 教學現場特殊情境：
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="例如：若有學習落後或閱讀速度較慢的學生，此處教學鷹架該如何簡化？"
              disabled={isAsking}
              className="flex-1 px-4 py-3 text-xs font-bold rounded-2xl border-2 border-amber-700/60 bg-black/20 text-amber-100 placeholder:text-amber-300/40 focus:border-amber-300 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim() || isAsking}
              className="px-6 py-3 bg-[#d55734] hover:bg-[#bd4726] disabled:opacity-50 text-white text-xs font-black tracking-wider rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-white/20"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              ) : (
                <Send className="w-4 h-4 text-amber-200" />
              )}
              <span>追問</span>
            </button>
          </div>
        </form>

        {/* User follow-up conversation history if any */}
        {result.userFollowUps && result.userFollowUps.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-amber-800/60">
            <h4 className="text-xs font-black tracking-wider text-amber-300">
              📝 本階段追問歷程：
            </h4>
            {result.userFollowUps.map((item, qIdx) => (
              <div
                key={qIdx}
                className="bg-black/20 rounded-2xl p-4 border border-amber-700/60 space-y-2 text-xs"
              >
                <div className="font-black text-amber-200 flex items-start gap-2">
                  <span className="px-2 py-0.5 bg-[#d55734] text-white rounded-full font-black text-[10px]">
                    Q
                  </span>
                  <span>{item.question}</span>
                </div>
                <div className="pl-6 text-amber-100 leading-relaxed border-l-2 border-[#d55734] ml-2">
                  {item.isLoading ? (
                    <div className="flex items-center gap-2 text-amber-300 py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>正在深入解析中...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none text-amber-100">
                      <MarkdownRenderer content={item.answer || ""} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next Stage Action Trigger */}
        <div className="pt-5 border-t border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-amber-200/80 text-center sm:text-left">
            {nextStageMeta ? (
              <span>
                若本階段無需追問，可直接點擊右側按鈕進行{" "}
                <strong className="text-amber-100 underline decoration-amber-400">
                  {nextStageMeta.badge} {nextStageMeta.name}
                </strong>
              </span>
            ) : (
              <span className="text-amber-300 font-black">
                🎉 恭喜！您已完成所有 6 個階段！可於右側直接展開 Canvas 排版小考題。
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {nextStageNum ? (
              <button
                onClick={() => onGoToNextStage(nextStageNum)}
                disabled={isLoadingNext}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#d55734] hover:bg-[#bd4726] text-white text-xs font-black tracking-wider rounded-2xl shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] border-2 border-[#362723] disabled:opacity-60 flex items-center justify-center gap-2.5 transition-all cursor-pointer group shrink-0"
              >
                {isLoadingNext ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>診斷載入中 STEP 0{nextStageNum}...</span>
                  </>
                ) : (
                  <>
                    <span>前往第 0{nextStageNum} 步驟 ({nextStageMeta?.name})</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenCanvas}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#d55734] hover:bg-[#bd4726] text-white text-xs font-black tracking-wider rounded-2xl shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] border-2 border-[#362723] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileEdit className="w-4 h-4 text-amber-200" />
                <span>進入 CANVAS 試卷排版板</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
