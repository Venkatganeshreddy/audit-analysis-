export const AGENT_CONFIG = {
  thresholds: {
    practiceCompletionLow: 40, lectureCompletionLow: 50, examCompletionLow: 45,
    overallCompletionLow: 50, deliveryRatioLow: 0.6, deliveryRatioGood: 0.85,
    participationLow: 40, scoreLow: 0.5, practiceToLectureIdeal: 0.8,
    atRiskDeliveryPct: 60, semesterProgressWarning: 0.5,
  },
  riskWeights: { delivery: 0.3, completion: 0.25, practice: 0.2, assessment: 0.15, timeline: 0.1 },
  severity: { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#10b981' },
};

export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-500' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-500' },
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-500' },
};
