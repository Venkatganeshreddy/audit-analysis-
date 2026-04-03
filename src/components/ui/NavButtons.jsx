import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { addRipple } from '../../utils/ripple';

export default function NavButtons({ onSwitchView, onReset }) {
  const { isDark } = useTheme();

  return (
    <div className="fixed top-3 left-3 sm:left-auto sm:right-4 sm:top-4 z-40 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
      <ThemeToggle />
      <button
        onClick={onSwitchView}
        onMouseDown={addRipple}
        className={`ripple-btn touch-target px-3 sm:px-4 py-2 shadow-lg rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-all ${
          isDark
            ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700'
            : 'bg-white text-gray-600 hover:text-gray-800 hover:shadow-xl border border-gray-100'
        }`}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Switch View</span>
      </button>
      <button
        onClick={onReset}
        onMouseDown={addRipple}
        className={`ripple-btn touch-target px-3 sm:px-4 py-2 shadow-lg rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-all ${
          isDark
            ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700'
            : 'bg-white text-gray-600 hover:text-gray-800 hover:shadow-xl border border-gray-100'
        }`}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>New Upload</span>
      </button>
    </div>
  );
}
