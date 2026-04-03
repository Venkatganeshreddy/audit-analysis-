import AnimatedView from './ui/AnimatedView';
import { addRipple } from '../utils/ripple';

export default function AnalysisSelector({ semester, batch, onSelectDesign, onSelectDelivery, onBack }) {
  return (
    <AnimatedView>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8 animate-fade-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-xl shadow-indigo-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">NIAT Analytics</h1>
            <p className="text-indigo-300 mb-1">{semester} • {batch}</p>
            <p className="text-indigo-400/60 text-sm">Select how you want to view the analysis</p>
          </div>

          <div className="space-y-4">
            {/* Design Perspective */}
            <button
              onClick={onSelectDesign}
              onMouseDown={addRipple}
              className="ripple-btn w-full bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 active:scale-[0.99] transition-all text-left group touch-target"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">From Design Perspective</h3>
                  <p className="text-sm text-white/50">
                    Group universities by{' '}
                    <span className="font-medium text-amber-400">Initial Allotted Hours</span>{' '}
                    according to Academic Calendar
                  </p>
                  <div className="mt-3">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                      Based on planned allocation
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/20 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Delivery Perspective */}
            <button
              onClick={onSelectDelivery}
              onMouseDown={addRipple}
              className="ripple-btn w-full bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 active:scale-[0.99] transition-all text-left group touch-target"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">From Delivery Perspective</h3>
                  <p className="text-sm text-white/50">
                    Group universities by{' '}
                    <span className="font-medium text-blue-400">Average Sessions Delivered</span>{' '}
                    (actual engagement)
                  </p>
                  <div className="mt-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                      Based on actual delivery
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              onMouseDown={addRipple}
              className="ripple-btn touch-target text-sm text-white/40 hover:text-white/70 flex items-center gap-2 mx-auto transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Upload
            </button>
          </div>
        </div>
      </div>
    </AnimatedView>
  );
}
