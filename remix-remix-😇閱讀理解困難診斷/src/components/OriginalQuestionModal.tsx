import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";

interface OriginalQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBase64?: string;
  imageMimeType?: string;
  fileName?: string;
  unit: string;
  grade: string;
  customContext?: string;
}

export const OriginalQuestionModal: React.FC<OriginalQuestionModalProps> = ({
  isOpen,
  onClose,
  imageBase64,
  imageMimeType,
  fileName,
  unit,
  grade,
  customContext,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if it's an image
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

  // Reset zoom & pan when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleFit = () => {
    setScale(1.25);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.15, 0.5));
    }
  };

  const handleCopyText = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = () => {
    if (!imageSrc) return;
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = fileName || `math_question_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] bg-[#fffef7] border-4 border-[#362723] rounded-3xl shadow-[8px_8px_0px_0px_rgba(54,39,35,1)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#f59e0b] border-b-3 border-[#362723] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl">📸</span>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-[#362723] truncate">
                原始題目檢視與放大
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-[#362723]/80">
                <span className="truncate max-w-[200px] sm:max-w-md">
                  單元：{unit || "數學題"} · {grade}
                </span>
                {fileName && (
                  <span className="bg-white/80 border border-[#362723] px-1.5 py-0.2 rounded-sm text-[10px]">
                    {fileName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 bg-white hover:bg-amber-100 border-2 border-[#362723] rounded-lg text-[#362723] shadow-xs active:translate-y-0.5 cursor-pointer"
                  title="放大 (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 bg-white hover:bg-amber-100 border-2 border-[#362723] rounded-lg text-[#362723] shadow-xs active:translate-y-0.5 cursor-pointer"
                  title="縮小 (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 bg-white hover:bg-amber-100 border-2 border-[#362723] rounded-lg text-[#362723] shadow-xs active:translate-y-0.5 cursor-pointer hidden sm:block"
                  title="重設大小 100%"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFit}
                  className="p-1.5 bg-white hover:bg-amber-100 border-2 border-[#362723] rounded-lg text-[#362723] shadow-xs active:translate-y-0.5 cursor-pointer hidden sm:block"
                  title="最適螢幕大小"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="p-1.5 bg-white hover:bg-amber-100 border-2 border-[#362723] rounded-lg text-[#362723] shadow-xs active:translate-y-0.5 cursor-pointer"
                  title="下載題目原圖"
                >
                  <Download className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-[#362723] px-1 hidden md:inline-block">
                  {Math.round(scale * 100)}%
                </span>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-red-500 hover:bg-red-600 text-white border-2 border-[#362723] rounded-lg shadow-xs active:translate-y-0.5 cursor-pointer ml-1"
              title="關閉 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={isImage ? handleWheel : undefined}
          className={`flex-1 overflow-auto bg-[#faf8f2] p-4 sm:p-8 flex items-center justify-center relative select-none ${
            isImage && scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {isImage && imageSrc ? (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="max-w-full max-h-full flex items-center justify-center origin-center"
            >
              <img
                src={imageSrc}
                alt="原始數學題目"
                className="max-h-[75vh] w-auto object-contain rounded-xl border-2 border-[#362723] shadow-lg pointer-events-none"
              />
            </div>
          ) : (
            /* Fallback Text / Document Display */
            <div className="w-full max-w-3xl bg-white border-3 border-[#362723] rounded-2xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(54,39,35,1)] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#d55734]" />
                  <h4 className="font-black text-base text-[#362723]">
                    題目內容與文字脈絡
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      customContext || unit || "無文字內容"
                    )
                  }
                  className="flex items-center gap-1 text-xs font-bold text-[#362723] px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-[#362723] rounded-lg cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製文字</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-stone-500 block mb-1">
                    數學單元主題：
                  </span>
                  <p className="text-sm font-black text-[#362723] bg-[#fbf8ee] p-3 rounded-xl border border-stone-200">
                    {unit || "未填寫單元"}
                  </p>
                </div>

                {customContext && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 block mb-1">
                      題目描述 / 易錯實例文本：
                    </span>
                    <div className="text-sm font-medium text-[#362723] bg-[#fbf8ee] p-4 rounded-xl border border-stone-200 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                      {customContext}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating hint at bottom */}
          {isImage && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-xs">
              💡 滾動滑鼠滾輪可縮放 · 放大後可按住滑鼠拖曳移動
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
