import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { addRipple } from '../../utils/ripple';

export default function NavButtons({ onSwitchView, onReset }) {
  const { isDark } = useTheme();

  return (
    <div className="fixed left-3 top-3 z-40 flex flex-col gap-2 sm:left-auto sm:right-4 sm:top-4 sm:flex-row">
      <ThemeToggle />

      <button
        onClick={onSwitchView}
        onMouseDown={addRipple}
        className={`ripple-btn touch-target flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition active:scale-95 sm:text-sm ${
          isDark
            ? 'border-white/10 bg-slate-900/88 text-slate-200 hover:bg-slate-800'
            : 'border-slate-200 bg-white/96 text-slate-700 hover:bg-slate-50 shadow-sm'
        }`}
      >
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Switch View</span>
      </button>

      <button
        onClick={onReset}
        onMouseDown={addRipple}
        className={`ripple-btn touch-target flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition active:scale-95 sm:text-sm ${
          isDark
            ? 'border-white/10 bg-slate-900/88 text-slate-200 hover:bg-slate-800'
            : 'border-slate-200 bg-white/96 text-slate-700 hover:bg-slate-50 shadow-sm'
        }`}
      >
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>New Upload</span>
      </button>
    </div>
  );
}
