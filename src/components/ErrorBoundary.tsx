import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled render error:', error, errorInfo.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#F9F7F2] dark:bg-[#121211] flex items-center justify-center p-8 transition-colors duration-300">
          <div className="max-w-md w-full bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-2xl p-8 shadow-[8px_8px_0px_rgba(26,26,26,0.15)] dark:shadow-[8px_8px_0px_rgba(250,248,245,0.15)] text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>

            <h2 className="text-lg font-serif italic font-bold text-[#1A1A1A] dark:text-[#FAF8F5] mb-2">
              Something went wrong
            </h2>

            <p className="text-xs text-[#5C5850] dark:text-[#BEB9AD] leading-relaxed mb-4">
              BoardCraft encountered an unexpected error. Your data is safely stored in the cloud — nothing was lost.
            </p>

            <div className="bg-[#F4F1EA] dark:bg-[#25231F] border border-dashed border-[#C5C2B9] dark:border-[#4D483E] rounded-lg p-3 mb-6 text-left">
              <span className="block text-[9px] font-mono font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">
                Error Details
              </span>
              <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 break-all leading-relaxed">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] text-white dark:text-[#121211] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-[3px_3px_0px_rgba(26,26,26,0.15)] active:translate-y-0.5"
            >
              <RefreshCw size={14} />
              Reload BoardCraft
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
