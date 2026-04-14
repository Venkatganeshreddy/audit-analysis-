import AnimatedView from './ui/AnimatedView';
import { addRipple } from '../utils/ripple';

export default function AnalysisSelector({ semester, batch, onSelectDesign, onSelectDelivery, onBack }) {
  return (
    <AnimatedView>
      <div className="ui-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="hero-panel mb-6 rounded-3xl p-6 text-center sm:p-8 animate-fade-slide-up">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">Analysis Setup</p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Choose your analysis lens</h1>
            <p className="mt-2 text-sm text-slate-100/80">
              {semester} and {batch}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={onSelectDesign}
              onMouseDown={addRipple}
              className="ripple-btn panel-surface rounded-2xl p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="section-title mb-2">Lens</p>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Design Perspective</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Group universities by planned allotted hours from the academic calendar.
              </p>
              <span className="dashboard-chip mt-4">
                Planned allocation
              </span>
            </button>

            <button
              onClick={onSelectDelivery}
              onMouseDown={addRipple}
              className="ripple-btn panel-surface rounded-2xl p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="section-title mb-2">Lens</p>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Delivery Perspective</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Group universities by average sessions delivered as actual engagement.
              </p>
              <span className="dashboard-chip mt-4">
                Actual delivery
              </span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              onMouseDown={addRipple}
              className="ripple-btn dashboard-button-secondary rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Back to Upload
            </button>
          </div>
        </div>
      </div>
    </AnimatedView>
  );
}
