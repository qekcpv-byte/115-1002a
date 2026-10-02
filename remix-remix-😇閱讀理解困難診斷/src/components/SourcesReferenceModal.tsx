import React, { useState } from "react";
import { X, BookOpen, ExternalLink, Table, LayoutList } from "lucide-react";
import { DIFFICULTY_SOURCES_LIST } from "../data/presets";

interface SourcesReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesReferenceModal: React.FC<SourcesReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#362723]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fffef7] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-[12px_12px_0px_0px_rgba(54,39,35,1)] border-4 border-[#362723] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#362723] flex items-center justify-between bg-[#fbf8ee]">
          <div className="flex items-center gap-3">
            <div className="border-2 border-[#362723] px-2.5 py-1 bg-[#d55734] text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(54,39,35,1)]">
              THEORY
            </div>
            <div>
              <div className="text-[10px] font-black text-[#d55734] tracking-widest uppercase">
                (優履工作室研發)
              </div>
              <h3 className="font-black text-[#362723] text-lg tracking-tight">
                學生的數學閱讀理解困難來源
              </h3>
              <p className="text-xs font-bold text-[#362723]/70">
                如何分類有利進一步教學設計？（7大核心認知架構）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#f4ebd0] p-1 rounded-xl border-2 border-[#362723] text-xs font-black">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#362723] text-white shadow-sm"
                    : "text-[#362723] hover:bg-white/60"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>表格對照</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-[#362723] text-white shadow-sm"
                    : "text-[#362723] hover:bg-white/60"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>條列卡片</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#362723] hover:bg-[#d55734] hover:text-white border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list / table */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          <div className="p-4 bg-[#f4ebd0]/70 border-2 border-[#362723] rounded-2xl text-xs text-[#362723] leading-relaxed font-bold shadow-xs">
            💡
            <span className="font-black ml-1 text-[#d55734]">診斷系統指導原則：</span>
            本系統在階段 1～6 中，均以此 7 大閱讀困難來源為診斷標竿，協助教師由「表層算式錯誤」回溯至「深層文字理解盲點」，設計精準之補救教學策略。
          </div>

          {viewMode === "table" ? (
            <div className="my-2 overflow-x-auto rounded-2xl border-2 border-[#362723] shadow-[4px_4px_0px_0px_rgba(54,39,35,1)]">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="bg-[#362723] text-white font-black text-xs uppercase tracking-wider">
                    <th className="py-3 px-3.5 border-r border-[#362723]/30 w-36">困難類型</th>
                    <th className="py-3 px-3.5 border-r border-[#362723]/30 w-28">認知維度標籤</th>
                    <th className="py-3 px-3.5">教學現場常見迷思與具體範例</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#362723]/15">
                  {DIFFICULTY_SOURCES_LIST.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#fbf8ee]"}
                    >
                      <td className="py-3 px-3.5 font-black text-[#362723] border-r-2 border-[#362723]/15 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#d55734] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            0{item.id}
                          </span>
                          <span className="font-black text-xs">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 border-r-2 border-[#362723]/15 align-top">
                        <span className="inline-block text-[10px] px-2 py-0.5 border border-[#362723] bg-[#f4ebd0] text-[#362723] font-black rounded-md">
                          {item.tag}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#362723] font-medium leading-relaxed align-top">
                        {item.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {DIFFICULTY_SOURCES_LIST.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border-2 border-[#362723] bg-white hover:bg-[#fbf8ee] shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#362723] text-white text-xs font-black flex items-center justify-center shrink-0">
                        0{item.id}
                      </span>
                      <h4 className="font-black text-[#362723] text-sm">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 border-2 border-[#362723] bg-[#f4ebd0] text-[#362723] font-black uppercase tracking-wider rounded-md">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#362723]/80 pl-8 leading-relaxed">
                    {item.example}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-[#fbf8ee] rounded-xl border-2 border-[#362723] text-xs text-[#362723] font-bold flex items-center justify-between">
            <span>參考教學影片：文字題的閱讀理解策略</span>
            <a
              href="https://www.youtube.com/watch?v=WQYzOpcnWxs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d55734] hover:text-[#362723] flex items-center gap-1 font-black underline"
            >
              開啟觀看 <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-[#362723] bg-[#fbf8ee] flex items-center justify-between">
          <span className="text-xs text-[#362723]/70 font-bold">
            優履工作室研發 · 數學閱讀理解分析小幫手
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#362723] hover:bg-[#d55734] text-white text-xs font-black uppercase tracking-wider border-2 border-[#362723] rounded-xl shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            關閉參考視窗
          </button>
        </div>
      </div>
    </div>
  );
};

