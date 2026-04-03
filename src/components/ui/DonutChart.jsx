import { useTheme } from '../../context/ThemeContext';

export default function DonutChart({ value, size = 100, strokeWidth = 10, color = '#f59e0b' }) {
  const { isDark } = useTheme();
  const r = (size - strokeWidth) / 2;
  const c = r * 2 * Math.PI;
  const o = c - (value / 100) * c;
  const circleStyle = {
    '--dash-total': c,
    '--dash-offset': o,
    animation: 'donutDraw 1s ease-out forwards',
    strokeDasharray: c,
    strokeDashoffset: c,
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? '#334155' : '#f3f4f6'} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={circleStyle}
        />
      </svg>
    </div>
  );
}
