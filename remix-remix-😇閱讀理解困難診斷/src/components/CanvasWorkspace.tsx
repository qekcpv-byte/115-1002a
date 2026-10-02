import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  ArrowLeft,
  Settings2,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { CanvasDocument, CanvasQuestion } from "../types";
import { copyToClipboard } from "../utils/clipboard";

interface CanvasWorkspaceProps {
  document: CanvasDocument;
  onUpdateDocument: (doc: CanvasDocument) => void;
  onBackToStages: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  document,
  onUpdateDocument,
  onBackToStages,
}) => {
  // Mode: "student" (student exam paper) or "teacher" (diagnostic key with reading impediment tags)
  const [viewMode, setViewMode] = useState<"student" | "teacher">("student");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable header fields
  const [title, setTitle] = useState(document.docTitle);
  const [school, setSchool] = useState(document.school);
  const [timeLimit, setTimeLimit] = useState(document.timeLimit);
  const [instructions, setInstructions] = useState(document.instructions);

  const handleSaveHeader = () => {
    onUpdateDocument({
      ...document,
      docTitle: title,
      school,
      timeLimit,
      instructions,
    });
    setIsEditingHeader(false);
  };

  const handleUpdateQuestion = (qId: string, updatedFields: Partial<CanvasQuestion>) => {
    const newQuestions = document.questions.map((q) =>
      q.id === qId ? { ...q, ...updatedFields } : q
    );
    onUpdateDocument({
      ...document,
      questions: newQuestions,
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    const newQuestions = document.questions
      .filter((q) => q.id !== qId)
      .map((q, idx) => ({ ...q, number: idx + 1 }));
    onUpdateDocument({
      ...document,
      questions: newQuestions,
    });
  };

  const handleAddQuestion = () => {
    const newQ: CanvasQuestion = {
      id: `q_${Date.now()}`,
      number: document.questions.length + 1,
      type: "choice",
      score: 25,
      text: "請在此輸入自訂題目的情境敘述...",
      options: [
        "(A) 第一個選項",
        "(B) 第二個選項",
        "(C) 第三個選項",
        "(D) 第四個選項",
      ],
      difficultySource: "字詞意義不清 / 缺乏閱讀策略",
      diagnosticNote: "檢測學生對題目中核心條件句的掌握度",
      distractorAnalysis: "(A) 典型誤判原因；(B) 計算陷阱...",
      readingHint: "圈出題目的關鍵字與已知條件",
      answer: "(A) 正確解答與解說",
    };
    onUpdateDocument({
      ...document,
      questions: [...document.questions, newQ],
    });
    setEditingQuestionId(newQ.id);
  };

  const handleCopyMarkdown = async () => {
    let md = `# ${document.docTitle}\n`;
    md += `【年級】：${document.grade} | 【測驗時間】：${document.timeLimit}\n`;
    md += `【作答說明】：${document.instructions}\n\n`;
    document.questions.forEach((q) => {
      md += `### 第 ${q.number} 題（${q.score} 分）\n`;
      md += `${q.text}\n\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => (md += `- ${opt}\n`));
        md += `\n`;
      }
      if (viewMode === "teacher") {
        md += `> **【診斷困難來源】**：${q.difficultySource}\n`;
        md += `> **【學生盲點分析】**：${q.diagnosticNote}\n`;
        md += `> **【誘答選項分析】**：${q.distractorAnalysis}\n`;
        md += `> **【閱讀提示】**：${q.readingHint}\n`;
        md += `> **【正確答案】**：${q.answer}\n\n`;
      }
    });

    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportWord = () => {
    const contentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${document.docTitle}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; line-height: 1.6; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .meta-table td { padding: 6px; border: 1px solid #ccc; font-size: 14px; }
          .instructions { background: #f9f9f9; padding: 10px; border-left: 4px solid #333; margin-bottom: 20px; font-size: 13px; }
          .q-card { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px dashed #aaa; }
          .q-title { font-weight: bold; font-size: 15px; margin-bottom: 8px; }
          .options { margin-left: 20px; margin-bottom: 10px; }
          .draft-box { height: 100px; border: 1px solid #ddd; margin-top: 10px; padding: 5px; font-size: 12px; color: #999; }
          .teacher-block { background: #eef2ff; padding: 10px; border-left: 4px solid #4f46e5; margin-top: 10px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${document.school}</h2>
          <h1>${document.docTitle}</h1>
          <p>（${document.grade} · 測驗時間：${document.timeLimit} · 滿分：${document.totalScore}分）</p>
        </div>
        <table class="meta-table">
          <tr>
            <td>班級：___________</td>
            <td>座號：______</td>
            <td>姓名：___________</td>
            <td>得分：___________</td>
          </tr>
        </table>
        <div class="instructions">
          <strong>【作答說明】：</strong>${document.instructions}
        </div>
        ${document.questions
          .map(
            (q) => `
          <div class="q-card">
            <div class="q-title">${q.number}. (${q.score}分) ${q.text}</div>
            ${
              q.options && q.options.length > 0
                ? `<div class="options">${q.options
                    .map((opt) => `<div>${opt}</div>`)
                    .join("")}</div>`
                : ""
            }
            ${
              viewMode === "student"
                ? `<div class="draft-box">【思考、畫圖與計算草稿區】</div>`
                : `
              <div class="teacher-block">
                <div><strong>【診斷之閱讀理解障礙類型】：</strong>${q.difficultySource}</div>
                <div><strong>【學生認知盲點診斷】：</strong>${q.diagnosticNote}</div>
                <div><strong>【誘答陷阱分析】：</strong>${q.distractorAnalysis}</div>
                <div><strong>【閱讀引導提示 (Hint)】：</strong>${q.readingHint}</div>
                <div><strong>【正確答案與解析】：</strong>${q.answer}</div>
              </div>
            `
            }
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;

    const blob = new Blob([contentHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.docTitle}_${viewMode === "student" ? "學生卷" : "教師診斷卷"}.doc`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn("Print action blocked or not supported in current environment:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Top Action Bar */}
      <div className="bg-[#362723] text-white border-4 border-[#362723] rounded-3xl p-6 sm:p-7 shadow-[6px_6px_0px_0px_rgba(213,87,52,1)] flex flex-col md:flex-row items-center justify-between gap-5 print:hidden">
        <div className="flex items-center gap-4 self-start md:self-center">
          <button
            onClick={onBackToStages}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-black text-amber-100 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-2xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>返回各階段</span>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-[#d55734] text-white border border-[#362723] rounded-full flex items-center gap-1 shadow-sm">
                <span>📋</span>
                <span>第 06 階段 · CANVAS 試卷排版板</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>小考題排版與診斷手冊工作板</span>
            </h2>
            <p className="text-xs font-bold text-amber-200/80 tracking-wide">
              即時編輯題目、切換學生卷與教師版、一鍵列印或下載 Word 格式
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* View mode toggle */}
          <div className="bg-black/30 p-1 rounded-2xl flex items-center gap-1 border-2 border-white/20">
            <button
              onClick={() => setViewMode("student")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                viewMode === "student"
                  ? "bg-white text-[#362723] shadow-sm"
                  : "text-amber-200 hover:text-white"
              }`}
            >
              📝 學生測驗卷
            </button>
            <button
              onClick={() => setViewMode("teacher")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                viewMode === "teacher"
                  ? "bg-[#d55734] text-white shadow-sm"
                  : "text-amber-200 hover:text-white"
              }`}
            >
              🔍 教師診斷卷
            </button>
          </div>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="下載可使用 Word 開啟之文件"
          >
            <Download className="w-3.5 h-3.5 text-[#d55734]" />
            <span>匯出 WORD</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#362723]" />
            <span>列印試卷</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#362723] bg-amber-100 hover:bg-amber-200 border-2 border-[#362723] rounded-2xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#d55734]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#362723]" />
            )}
            <span>{copied ? "已複製" : "複製文字"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Paper Layout (Simulates Real Test Paper) */}
      <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl shadow-[5px_5px_0px_0px_rgba(54,39,35,1)] p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Paper Header */}
        <div className="text-center pb-6 border-b-3 border-[#362723] relative group">
          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="absolute right-0 top-0 text-xs font-black text-[#d55734] hover:text-[#362723] flex items-center gap-1 border-2 border-[#362723] px-3 py-1 bg-amber-100 rounded-xl shadow-[2px_2px_0px_0px_rgba(54,39,35,1)] opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingHeader ? "取消編輯" : "編輯卷頭"}</span>
          </button>

          {isEditingHeader ? (
            <div className="space-y-4 max-w-xl mx-auto text-left bg-amber-50/70 p-5 rounded-2xl border-2 border-amber-900 print:hidden">
              <div>
                <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                  學校 / 機構名稱
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-amber-900 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                  測驗卷標題
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-amber-900 rounded-xl bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                    測驗時間
                  </label>
                  <input
                    type="text"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border-2 border-amber-900 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                    作答說明
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border-2 border-amber-900 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveHeader}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl border border-amber-900 shadow-sm cursor-pointer"
                >
                  儲存卷頭設定
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm font-black tracking-widest text-[#8b4513] flex items-center justify-center gap-1.5">
                <span>📐 優履工作室研發 · 數學教學研習中心</span>
                <span>•</span>
                <span>{document.school}</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-950 my-2">
                {document.docTitle}
              </h1>
              <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-bold text-amber-800">
                <span className="bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-800/30">適用年級：{document.grade}</span>
                <span className="bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-800/30">測驗時間：{document.timeLimit}</span>
                <span className="bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-800/30">滿分：{document.totalScore} 分</span>
                {viewMode === "teacher" && (
                  <span className="font-black text-white bg-red-500 border border-amber-900 px-2.5 py-0.5 rounded-full shadow-sm">
                    【教師專用·閱讀障礙診斷手冊】
                  </span>
                )}
              </div>
            </>
          )}

          {/* Student Info Box */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 border-2 border-amber-900 rounded-2xl text-xs divide-x-2 sm:divide-y-0 divide-y-2 divide-amber-900 bg-amber-50/50 font-bold overflow-hidden">
            <div className="p-2.5 text-amber-900">班級：_______</div>
            <div className="p-2.5 text-amber-900">座號：_______</div>
            <div className="p-2.5 text-amber-900">姓名：_______</div>
            <div className="p-2.5 text-amber-950 font-black bg-amber-100/70">
              得分：_______
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-left text-xs bg-amber-50/60 p-3.5 rounded-2xl text-amber-950 border-l-4 border-red-500 font-medium">
            <span className="font-black text-red-600">【作答與閱讀理解指引】：</span>
            {document.instructions}
          </div>
        </div>

        {/* Questions List */}
        <div className="pt-8 space-y-10">
          {document.questions.map((q) => {
            const isEditing = editingQuestionId === q.id;

            return (
              <div
                key={q.id}
                className="relative pb-8 border-b-2 border-stone-200 group last:border-b-0"
              >
                {/* Question Toolbar (hidden on print) */}
                <div className="absolute right-0 top-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                  <button
                    onClick={() =>
                      setEditingQuestionId(isEditing ? null : q.id)
                    }
                    className="p-1.5 text-amber-900 hover:text-amber-950 border-2 border-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] cursor-pointer"
                    title="編輯此題"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 border-2 border-amber-900 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] cursor-pointer"
                    title="刪除此題"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isEditing ? (
                  /* Question Edit Form */
                  <div className="space-y-4 bg-amber-50/70 p-5 rounded-2xl border-2 border-amber-900 print:hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-wide text-amber-950">
                        編輯第 0{q.number} 題
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-amber-950">配分：</label>
                        <input
                          type="number"
                          value={q.score}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              score: Number(e.target.value),
                            })
                          }
                          className="w-20 text-xs font-bold px-2 py-1 border-2 border-amber-900 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                        題目敘述 (情境題文本)
                      </label>
                      <textarea
                        rows={3}
                        value={q.text}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { text: e.target.value })
                        }
                        className="w-full text-xs font-medium p-3 border-2 border-amber-900 rounded-xl bg-white focus:bg-amber-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                        選項 (每行一個選項)
                      </label>
                      <textarea
                        rows={4}
                        value={q.options ? q.options.join("\n") : ""}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            options: e.target.value.split("\n"),
                          })
                        }
                        className="w-full text-xs font-medium p-3 border-2 border-amber-900 rounded-xl bg-white focus:bg-amber-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                          診斷之困難來源
                        </label>
                        <input
                          type="text"
                          value={q.difficultySource}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              difficultySource: e.target.value,
                            })
                          }
                          className="w-full text-xs font-medium p-2.5 border-2 border-amber-900 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black tracking-wide text-amber-950 mb-1">
                          正確解答與思考
                        </label>
                        <input
                          type="text"
                          value={q.answer}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              answer: e.target.value,
                            })
                          }
                          className="w-full text-xs font-medium p-2.5 border-2 border-amber-900 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl border border-amber-900 shadow-sm cursor-pointer"
                      >
                        完成題目修改
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Question Display View */
                  <div>
                    {/* Question Statement */}
                    <div className="flex items-start gap-3 text-base font-bold text-amber-950 leading-relaxed">
                      <span className="font-black text-red-600 text-lg shrink-0">
                        0{q.number}.
                      </span>
                      <div className="flex-1">
                        <span>{q.text}</span>
                        <span className="text-xs font-bold text-amber-700 ml-2">
                          （{q.score} 分）
                        </span>
                      </div>
                    </div>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-4 ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-amber-950">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="p-3 border-2 border-amber-900/30 hover:border-amber-900 bg-amber-50/40 hover:bg-amber-100/50 rounded-2xl transition-colors"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Student Mode: Drafting Space */}
                    {viewMode === "student" && (
                      <div className="mt-5 ml-7 h-28 border-2 border-dashed border-amber-400 bg-amber-50/40 rounded-2xl p-3 text-xs text-amber-800/80 font-mono flex flex-col justify-between">
                        <span>✏️【閱讀理解草稿與幾何/數量表徵畫圖區】：請在此圈出關鍵詞，或畫出關係圖再作答</span>
                        <span className="self-end text-xs font-black text-amber-950">
                          本題答案：［　　］
                        </span>
                      </div>
                    )}

                    {/* Teacher Mode: Diagnostic Breakdown Panel */}
                    {viewMode === "teacher" && (
                      <div className="mt-5 ml-7 p-5 bg-amber-50 border-2 border-amber-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(120,53,15,1)] text-xs space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-red-500 text-white font-black text-[10px] rounded-full">
                            🎯 診斷困難類型
                          </span>
                          <span className="font-black text-amber-950 text-sm">
                            {q.difficultySource}
                          </span>
                        </div>

                        <div>
                          <strong className="font-black text-amber-950">
                            🧠 學生閱讀盲點診斷：
                          </strong>
                          <span className="text-amber-900 ml-1 leading-relaxed font-medium">
                            {q.diagnosticNote}
                          </span>
                        </div>

                        <div>
                          <strong className="font-black text-amber-950">
                            ⚠️ 誘答選項與陷阱剖析：
                          </strong>
                          <span className="text-amber-900 ml-1 leading-relaxed font-medium">
                            {q.distractorAnalysis}
                          </span>
                        </div>

                        <div>
                          <strong className="font-black text-amber-950">
                            💡 教師提示線索 (Reading Hint)：
                          </strong>
                          <span className="text-amber-950 ml-1 bg-white px-2.5 py-1 border border-amber-300 rounded-md font-bold inline-block mt-0.5">
                            {q.readingHint}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
                          <span className="font-black text-white bg-amber-800 px-2 py-0.5 text-[10px] rounded-full">
                            ✅ 標準答案與詳解
                          </span>
                          <span className="font-black text-amber-950 text-xs">
                            {q.answer}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Question Button in Canvas */}
        <div className="mt-10 pt-6 border-t-2 border-amber-900 flex justify-center print:hidden">
          <button
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-amber-900 hover:border-red-500 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(120,53,15,1)]"
          >
            <Plus className="w-4 h-4 text-red-600" />
            <span>新增一題診斷試題</span>
          </button>
        </div>
      </div>
    </div>
  );
};
