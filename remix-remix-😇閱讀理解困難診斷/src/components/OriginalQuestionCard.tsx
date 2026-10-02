import React, { useState } from "react";
import { ZoomIn, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { OriginalQuestionModal } from "./OriginalQuestionModal";

interface OriginalQuestionCardProps {
  imageBase64?: string;
  imageMimeType?: string;
  fileName?: string;
  unit: string;
  grade: string;
  customContext?: string;
}

export const OriginalQuestionCard: React.FC<OriginalQuestionCardProps> = ({
  imageBase64,
  imageMimeType,
  fileName,
  unit,
  grade,
  customContext,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isImage =
    imageBase64 &&
    (!imageMimeType ||
      imageMimeType.startsWith("image/") ||
      (fileName && /\.(png|jpe?g|webp|gif)$/i.test(fileName)));

  const imageSrc =
    isImage && imageBase64
      ? imageBase64.startsWith("data:")
        ? imageBase64
        : `data:${imageMimeType || "image/png"};base64,${imageBase64}`
      : undefined;

  // If there's no image and no context, we still provide the card referencing the math topic
  const displayText =
    customContext ||
    (unit ? `【題目單元】：${unit}（適用學段：${grade}）` : "已載入原始題目");

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div
          onClick={() => setIsModalOpen(true)}
          className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_rgba(54,39,35,1)] hover:shadow-[7px_7px_0px_0px_rgba(213,87,52,1)] transition-all cursor-pointer group select-none relative overflow-hidden"
        >
          {/* Header Bar styled exactly as Screenshot 1 */}
          <div className="w-full bg-[#f59e0b] group-hover:bg-[#fbbf24] border-2 border-dashed border-[#362723] rounded-2xl py-2.5 px-4 text-center font-black text-sm sm:text-base text-[#362723] shadow-xs flex items-center justify-center gap-2 transition-colors">
            <span className="text-base sm:text-lg">📸</span>
            <span>原始題目 (點擊放大)</span>
            <ZoomIn className="w-4 h-4 ml-1 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </div>

          {/* Content Body Preview */}
          <div className="mt-3 bg-[#fbf8ee] border-2 border-[#362723]/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isImage && imageSrc ? (
              <div className="w-full flex items-center gap-4">
                <div className="relative w-24 h-20 sm:w-32 sm:h-24 shrink-0 bg-white rounded-xl border-2 border-[#362723] overflow-hidden shadow-xs">
                  <img
                    src={imageSrc}
                    alt="題目縮圖"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 flex items-center justify-center transition-colors">
                    <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#d55734] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      圖片題
                    </span>
                    {fileName && (
                      <span className="text-xs font-bold text-[#362723] truncate max-w-[200px] sm:max-w-sm">
                        {fileName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#362723]/80 line-clamp-2">
                    {unit} · {grade}
                  </p>
                  <span className="text-[11px] font-extrabold text-[#d55734] inline-flex items-center gap-1 mt-1">
                    點擊此處展開高畫質檢視與任意縮放 🔍
                  </span>
                </div>
              </div>
            ) : (
              /* Text or document preview */
              <div className="w-full flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-[#362723] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-[#d55734]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {fileName ? "上傳教材文本" : "情境題目文本"}
                    </span>
                    {fileName && (
                      <span className="text-xs font-bold text-[#362723]">
                        {fileName}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-stone-500">
                      （{grade}）
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#362723] line-clamp-2 bg-white/80 p-2 rounded-lg border border-stone-200">
                    {displayText}
                  </p>
                  <span className="text-[11px] font-extrabold text-[#d55734] inline-flex items-center gap-1 mt-1">
                    點擊放大展開完整題目文字內容 🔍
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <OriginalQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageBase64={imageBase64}
        imageMimeType={imageMimeType}
        fileName={fileName}
        unit={unit}
        grade={grade}
        customContext={customContext}
      />
    </>
  );
};
