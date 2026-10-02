import React from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { STAGES } from "../data/presets";
import { StageNumber } from "../types";

interface StageTabsProps {
  currentStage: StageNumber;
  completedStages: StageNumber[];
  loadingStage: StageNumber | null;
  onSelectStage: (stage: StageNumber) => void;
  maxUnlockedStage: StageNumber;
}

export const StageTabs: React.FC<StageTabsProps> = ({
  currentStage,
  completedStages,
  loadingStage,
  onSelectStage,
  maxUnlockedStage,
}) => {
  const STAGE_ICONS: Record<number, string> = {
    1: "🔍",
    2: "📐",
    3: "📊",
    4: "⏱️",
    5: "🎯",
    6: "📋",
  };

  return (
    <div className="bg-[#fffef7] border-b-3 border-[#362723] px-4 sm:px-8 py-2.5 sticky top-[61px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="hidden lg:flex items-center gap-1.5 pr-3 border-r-2 border-[#362723]/20 shrink-0">
            <span className="text-sm">🎯</span>
            <span className="text-[11px] font-black text-[#362723] tracking-wider">
              診斷進度
            </span>
          </div>

          {STAGES.map((s) => {
            const isCompleted = completedStages.includes(s.number);
            const isActive = currentStage === s.number;
            const isLoading = loadingStage === s.number;
            const isUnlocked = s.number <= maxUnlockedStage;

            return (
              <button
                key={s.number}
                type="button"
                disabled={!isUnlocked || isLoading}
                onClick={() => onSelectStage(s.number)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all border-2 rounded-2xl shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#d55734] text-white border-[#362723] shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] translate-x-[-1px] translate-y-[-1px]"
                    : isCompleted
                    ? "bg-[#fbf7eb] text-[#362723] border-[#362723] hover:bg-amber-100/60 shadow-[2px_2px_0px_0px_rgba(54,39,35,1)]"
                    : isUnlocked
                    ? "bg-white text-[#362723] border-[#362723]/50 hover:border-[#362723] hover:bg-amber-50"
                    : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                }`}
              >
                <span className="text-sm">{STAGE_ICONS[s.number] || "📌"}</span>
                <span className={isActive ? "text-amber-200" : isCompleted ? "text-[#d55734]" : "text-gray-500"}>
                  0{s.number}
                </span>
                <span className="tracking-tight">{s.name}</span>

                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin ml-0.5" />
                ) : isCompleted ? (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-amber-200" : "text-[#d55734]"
                    }`}
                  />
                ) : !isUnlocked ? (
                  <Lock className="w-3 h-3 text-gray-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

