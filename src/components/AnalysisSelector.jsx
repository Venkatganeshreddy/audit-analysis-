import AnimatedView from './ui/AnimatedView';
import { addRipple } from '../utils/ripple';

export default function AnalysisSelector({ semester, batch, onSelectDesign, onSelectDelivery, onBack }) {
  return (
    <AnimatedView>
      <div className="ui-shell relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute -right-14 top-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <div className="hero-panel mb-6 rounded-3xl p-6 text-center sm:p-8 animate-fade-slide-up">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Context</p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Choose analysis lens</h1>
            <p className="mt-2 text-sm text-slate-200">
              {semester} and {batch}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={onSelectDesign}
              onMouseDown={addRipple}
              className="ripple-btn rounded-2xl border border-amber-300/25 bg-slate-900/45 p-5 text-left shadow-lg shadow-black/20 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-slate-900/70"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-900/35">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white">Design Perspective</h3>
              <p className="text-sm text-slate-300">
                Group universities by planned allotted hours from the academic calendar.
              </p>
              <span className="mt-4 inline-block rounded-full border border-amber-300/30 bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-200">
                Planned allocation
              </span>
            </button>

            <button
              onClick={onSelectDelivery}
              onMouseDown={addRipple}
              className="ripple-btn rounded-2xl border border-sky-300/25 bg-slate-900/45 p-5 text-left shadow-lg shadow-black/20 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-slate-900/70"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-950/40">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white">Delivery Perspective</h3>
              <p className="text-sm text-slate-300">
                Group universities by average sessions delivered as actual engagement.
              </p>
              <span className="mt-4 inline-block rounded-full border border-sky-300/30 bg-sky-400/15 px-2.5 py-1 text-xs font-medium text-sky-200">
                Actual delivery
              </span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              onMouseDown={addRipple}
              className="ripple-btn rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Back to Upload
            </button>
          </div>
        </div>
      </div>
    </AnimatedView>
  );
}
