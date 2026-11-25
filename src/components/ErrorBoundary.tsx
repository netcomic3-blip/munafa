/**
 * MUNAFA Crash-Proof React Error Boundary
 * Prevents white-screen crashes and provides instant one-click recovery.
 */

import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { LocalEdgeDb } from '../services/localEdgeDb';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected workspace rendering error.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('MUNAFA ErrorBoundary caught:', error);
  }

  handleRecover = () => {
    try {
      LocalEdgeDb.runSelfHealingAudit();
    } catch {
      // Safe recovery fallback
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#edf6f0] flex items-center justify-center p-4 text-[#052e16]">
          <div className="max-w-md w-full bg-white border-2 border-[#046c31] rounded-2xl overflow-hidden shadow-xl">
            <div className="munafa-bg-header bg-[#034720] text-white px-6 py-5 border-b-2 border-[#d4af37] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#023819] border border-[#facc15] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#fef08a]" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">MUNAFA System Recovery</h2>
                <p className="text-xs text-[#fef08a] font-bold">Automatic Crash Shield Activated</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#052e16] font-bold leading-relaxed">
                A temporary display error was intercepted safely before crashing your session. Your local device records remain intact.
              </p>

              <div className="p-3 bg-[#f2fbf5] border border-emerald-300 rounded-xl font-mono text-[11px] text-[#023819] break-words">
                {this.state.errorMessage}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={this.handleRecover}
                  className="flex-1 py-2.5 px-4 munafa-green-btn rounded-xl font-black cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#fef08a]" />
                  <span>Resume Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleHardReload}
                  className="py-2.5 px-4 munafa-gold-btn rounded-xl font-black cursor-pointer"
                >
                  Reload App
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
