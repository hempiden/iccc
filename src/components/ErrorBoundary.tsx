import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  declare props: Readonly<ErrorBoundaryProps>;
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = 'An unexpected error occurred in your workspace.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error) {
        if (String(parsed.error).toLowerCase().includes('permission')) {
          friendly =
            'Permission denied while accessing your private cloud bucket. Please sign out and sign in again with your Google account.';
        } else {
          friendly = String(parsed.error);
        }
      }
    } catch {
      if (error?.message) {
        friendly = error.message;
      }
    }
    return { hasError: true, message: friendly };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Workspace ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-white uppercase tracking-wide">
              Workspace Notice
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
