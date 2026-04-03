import { useTheme } from '../context/ThemeContext';
import AnimatedView from './ui/AnimatedView';
import ScrollToTop from './ui/ScrollToTop';
import { SERIES_RANGES } from '../constants';
import { addRipple } from '../utils/ripple';

export default function SeriesOverview({ seriesData, onSelectSeries, analysisType, semester, batch, filters }) {
  const { isDark } = useTheme();

  const pageBg = isDark
    ? 'bg-slate-900'
    : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100';
  const headingColor = isDark ? 'text-slate-100' : 'text-gray-900';
  const subColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const muted = isDark ? 'text-slate-500' : 'text-gray-400';
  const infoBg = isDark
    ? 'bg-amber-900/30 border-amber-700/50'
    : 'bg-amber-50 border-amber-200';
  const infoHeading = isDark ? 'text-amber-300' : 'text-amber-800';
  const infoText = isDark ? 'text-amber-400' : 'text-amber-700';
  const infoIconBg = isDark ? 'bg-amber-700/50' : 'bg-amber-200';
  const infoIconColor = isDark ? 'text-amber-300' : 'text-amber-700';

  return (
    <AnimatedView>
      <div className={`min-h-screen ${pageBg} p-4 sm:p-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 animate-fade-slide-up">
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${headingColor}`}>University Series Overview</h1>
            <p className={`mb-1 ${subColor}`}>{semester} • {batch}</p>
            {filters?.startDate && filters?.endDate && (
              <p className={`text-sm mb-1 ${muted}`}>📅 {filters.startDate} → {filters.endDate}</p>
            )}
            <p className={`text-sm ${muted}`}>
              Universities grouped by{' '}
              {analysisType === 'design'
                ? 'allotted hours (design perspective)'
                : 'average sessions delivered'}
            </p>
          </div>

          <div
            className={`max-w-4xl mx-auto mb-6 sm:mb-8 rounded-xl p-4 border animate-fade-slide-up ${infoBg}`}
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${infoIconBg}`}>
                <svg className={`w-4 h-4 ${infoIconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${infoHeading}`}>
                  {analysisType === 'design' ? 'Design Perspective' : 'Delivery Perspective'}
                </h4>
                <p className={`text-sm ${infoText}`}>
                  {analysisType === 'design' ? (
                    <>Universities categorized by <span className="font-semibold">Initial Allotted Hours</span> from Academic Calendar.</>
                  ) : (
                    <>Universities categorized by <span className="font-semibold">Average Sessions Delivered</span> (actual engagement).</>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {SERIES_RANGES.map((series) => {
              const data = seriesData[series.name];
              if (!data || data.universities.length === 0) return null;
              return (
                <div
                  key={series.name}
                  onClick={() => onSelectSeries(series.name)}
                  onMouseDown={addRipple}
                  className={`card-enter ripple-btn rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-[1.025] hover:shadow-xl active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isDark ? 'bg-slate-800' : 'bg-white'
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-label={`View Series ${series.name}`}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectSeries(series.name)}
                >
                  <div className={`bg-gradient-to-r ${series.bg} p-5 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium">Series</p>
                        <h2 className="text-3xl font-bold">{series.name}</h2>
                        <p className="text-white/80 text-xs mt-1">
                          {series.min}–{series.max === Infinity ? '∞' : series.max} allotted hrs
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">{data.universities.length}</p>
                        <p className="text-white/80 text-sm">universities</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                      <div className={`rounded-lg p-2 sm:p-3 text-center ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Avg Allotted</p>
                        <p className="text-lg sm:text-xl font-bold text-amber-600">
                          {data.avgAllottedHours ? data.avgAllottedHours.toFixed(0) : '—'}
                        </p>
                      </div>
                      <div className={`rounded-lg p-2 sm:p-3 text-center ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Avg Delivered</p>
                        <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                          {data.avgSessions.toFixed(0)}
                        </p>
                      </div>
                      <div className={`rounded-lg p-2 sm:p-3 text-center ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Students</p>
                        <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                          {data.totalStudents}
                        </p>
                      </div>
                    </div>

                    {data.avgAssessmentScore !== null && (
                      <div className={`rounded-lg p-3 mb-4 border ${isDark ? 'bg-purple-900/30 border-purple-700/50' : 'bg-purple-50 border-purple-100'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Avg Score</p>
                            <p className={`text-2xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                              {(data.avgAssessmentScore * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Avg Participation</p>
                            <p className={`text-2xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                              {data.avgParticipation.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Overall Completion</span>
                        <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                          {data.avgOverallCompletion.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className={`border-t pt-4 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Universities:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.universities.slice(0, 4).map((u, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 text-xs rounded-full truncate max-w-[140px] ${
                              isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                            }`}
                            title={u.name}
                          >
                            {u.name}
                          </span>
                        ))}
                        {data.universities.length > 4 && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-600'}`}>
                            +{data.universities.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors touch-target ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollToTop />
      </div>
    </AnimatedView>
  );
}
