import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#98d5f5] flex items-center justify-center p-4">
          <div className="bg-[#fffef7] border-4 border-[#362723] rounded-3xl p-8 max-w-lg w-full text-center shadow-[8px_8px_0px_0px_rgba(54,39,35,1)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-[#362723] flex items-center justify-center mx-auto mb-4 text-[#d55734] shadow-[3px_3px_0px_0px_rgba(54,39,35,1)]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#362723] mb-2">
              頁面載入遇到暫時性問題
            </h2>
            <p className="text-xs font-bold text-stone-600 mb-6 leading-relaxed">
              系統已自動保護目前狀態，請點擊下方按鈕重新載入。
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-stone-100 rounded-xl text-left border border-stone-300 text-xs font-mono text-stone-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d55734] hover:bg-[#bd4726] text-white text-xs font-black rounded-xl border-2 border-[#362723] shadow-[3px_3px_0px_0px_rgba(54,39,35,1)] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新整理頁面</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
