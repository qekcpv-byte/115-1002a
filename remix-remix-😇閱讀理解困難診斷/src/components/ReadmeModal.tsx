import React, { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { X, BookOpen, Download, Copy, Check, Sparkles, FileText } from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  readmeContent: string;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  readmeContent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(readmeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([readmeContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "README.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(54,39,35,1)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#d55734] p-5 sm:p-6 text-white border-b-3 border-[#362723] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-[#362723] flex items-center justify-center text-xl shadow-sm text-[#362723]">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-300 text-[#362723] rounded-full border border-[#362723] shadow-xs">
                  README.md 官方說明手冊 (優履工作室研發)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                數學閱讀理解困難診斷系統 · 官方設計指引 (優履工作室研發)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] transition-all cursor-pointer"
              title="下載 README.md 檔案"
            >
              <Download className="w-3.5 h-3.5 text-[#d55734]" />
              <span className="hidden sm:inline">下載 README.md</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] transition-all cursor-pointer"
              title="複製全文 Markdown"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#d55734]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#362723]" />
              )}
              <span className="hidden sm:inline">{copied ? "已複製" : "複製內容"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-[#362723] hover:bg-rose-50 border-2 border-[#362723] shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Markdown Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-stone-800 space-y-4">
          <MarkdownRenderer content={readmeContent} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#fbf8ee] border-t-2 border-[#362723] flex items-center justify-between text-xs text-[#362723] font-bold">
          <div className="flex items-center gap-2">
            <span>優履工作室研發 · 數學閱讀理解分析小幫手</span>
            <span>•</span>
            <span>波利亞解題思維 × 認知心理學 7 大閱讀障礙剖析</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#d55734] hover:bg-[#bd4726] text-white font-black rounded-xl border border-[#362723] shadow-sm cursor-pointer"
          >
            關閉說明
          </button>
        </div>
      </div>
    </div>
  );
};
