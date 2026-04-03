import { useTheme } from '../../context/ThemeContext';

export default function WorkloadBar({ label, value, maxValue = 500, color = '#ef4444' }) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-3 py-1">
      <span className={`text-sm w-20 sm:w-28 truncate flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{label}</span>
      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((value / maxValue) * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-sm font-semibold w-14 sm:w-16 text-right flex-shrink-0 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
        {value.toFixed(1)}h
      </span>
    </div>
  );
}
