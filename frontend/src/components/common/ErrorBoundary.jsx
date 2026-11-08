import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.state = { hasError: true, error, errorInfo };
  }

  handleReload = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121214] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1C1C21] p-8 rounded-2xl shadow-2xl border border-[#EDE5D8]/15 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F43F5E]/10 text-[#FB7185] rounded-2xl mb-4 border border-[#F43F5E]/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#FAF6F0]">Rendering Exception</h2>
            <p className="text-xs text-[#B8A892] mt-2 mb-4 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="p-3 bg-[#141417] rounded-xl text-xs font-mono text-[#B8A892] mb-6 text-left overflow-auto max-h-32 border border-[#EDE5D8]/8">
              {this.state.error?.stack || String(this.state.error)}
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E5A952] hover:bg-[#F3C68F] text-[#121214] rounded-xl text-xs font-bold transition-all shadow-[0_4px_18px_rgba(229,169,82,0.25)] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Return to Login</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
