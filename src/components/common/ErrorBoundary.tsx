import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi gangguan tak terduga pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SIAGA KARHUTLA ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10 text-[#0F172A]">
          <div className="w-full max-w-lg rounded-2xl border border-[#FECACA] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-[#0F172A]">
                  Terjadi Gangguan Saat Memuat Halaman
                </h1>
                <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                  Maaf, terjadi gangguan sementara pada sesi aplikasi. Silakan muat ulang
                  halaman untuk melanjutkan misi Anda.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#1E293B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F172A]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Muat Ulang Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
