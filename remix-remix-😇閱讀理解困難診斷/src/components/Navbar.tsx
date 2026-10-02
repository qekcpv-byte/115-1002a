import React from "react";
import { BookOpen, HelpCircle, FileText, RotateCcw, Sparkles } from "lucide-react";

interface NavbarProps {
  currentUnit: string;
  grade: string;
  onOpenSourcesModal: () => void;
  onOpenReadme: () => void;
  onReset: () => void;
  onOpenCanvasDirectly: () => void;
  hasCanvasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUnit,
  grade,
  onOpenSourcesModal,
  onOpenReadme,
  onReset,
  onOpenCanvasDirectly,
  hasCanvasData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#d55734] border-b-3 border-[#362723] px-4 lg:px-8 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title and Smiley Face matching the user's reference image */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Yellow smiling face badge */}
          <div className="w-10 h-10 rounded-full bg-[#f6be44] border-2 border-[#362723] flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] shrink-0 select-none">
            😊
          </div>

          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>數學閱讀理解分析小幫手(優履工作室研發)</span>
            </h1>
            <p className="text-[11px] font-bold text-amber-100/90 tracking-wide">
              數學閱讀理解困難診斷與 6 階段教學設計工作板
            </p>
          </div>
        </div>

        {/* Current Topic indicator & Actions */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-end">
          {currentUnit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fffef7] text-[#362723] border-2 border-[#362723] rounded-2xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] max-w-xs truncate">
              <BookOpen className="w-3.5 h-3.5 text-[#d55734] shrink-0" />
              <span className="truncate">
                {grade ? `[${grade}] ` : ""}
                {currentUnit}
              </span>
            </div>
          )}

          <button
            onClick={onOpenReadme}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-[#362723] bg-[#fffef7] hover:bg-amber-50 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="開啟完整系統設計手冊與使用說明 (README.md)"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#d55734]" />
            <span>📖 操作手冊</span>
          </button>

          <button
            onClick={onOpenSourcesModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-[#362723] bg-[#fffef7] hover:bg-amber-50 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="查看 7 大數學閱讀理解困難來源"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#1ba2e0]" />
            <span>7大困難診斷</span>
          </button>

          {hasCanvasData && (
            <button
              onClick={onOpenCanvasDirectly}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-[#d55734] hover:bg-[#bd4726] border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#f6be44]" />
              <span>Canvas 試卷板</span>
            </button>
          )}

          {currentUnit && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white hover:bg-black/10 border-2 border-white/60 hover:border-white rounded-2xl transition-all cursor-pointer"
              title="重新設定單元主題"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>更換題目</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
