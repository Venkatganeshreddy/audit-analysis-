import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import AnimatedView from './ui/AnimatedView';
import ScrollToTop from './ui/ScrollToTop';
import DonutChart from './ui/DonutChart';
import WorkloadBar from './ui/WorkloadBar';
import { getSemesterDatesForInstitute, normalizeCourseName, r2 } from '../utils/semesterHelpers';
import { addRipple } from '../utils/ripple';

export default function UniversityDetail({ data, assessmentData, selectedInstitute, onBack, onReset, semester }) {
  const { isDark } = useTheme();
  const [selectedSection, setSelectedSection] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const sections = useMemo(
    () => [...new Set(data.filter(d => d.institute === selectedInstitute).map(d => d.section).filter(Boolean))].sort(),
    [data, selectedInstitute]
  );

  useEffect(() => {
    if (sections.length) setSelectedSection(sections[0]);
    else setSelectedSection('');
  }, [sections]);

  const assessmentMetrics = useMemo(() => {
    if (!assessmentData) return null;
    let filtered = assessmentData.filter(d => d.university === selectedInstitute);
    if (selectedSection) filtered = filtered.filter(d => d.section === selectedSection);
    if (!filtered.length) return null;
    const courseScores = {};
    filtered.forEach(d => {
      const name = normalizeCourseName(d.course_code, semester);
      if (!courseScores[name]) courseScores[name] = { scores: [], parts: [] };
      courseScores[name].scores.push(d.avg_score);
      courseScores[name].parts.push(d.avg_participation);
    });
    const courses = Object.keys(courseScores).map(c => ({
      name: c,
      avgScore: courseScores[c].scores.reduce((a, b) => a + b, 0) / courseScores[c].scores.length,
      avgParticipation: courseScores[c].parts.reduce((a, b) => a + b, 0) / courseScores[c].parts.length,
    }));
    return {
      courses,
      overallScore: courses.reduce((s, c) => s + c.avgScore, 0) / courses.length,
      overallParticipation: courses.reduce((s, c) => s + c.avgParticipation, 0) / courses.length,
    };
  }, [assessmentData, selectedInstitute, selectedSection, semester]);

  const metrics = useMemo(() => {
    let filtered = data.filter(d => d.institute === selectedInstitute);
    if (selectedSection) filtered = filtered.filter(d => d.section === selectedSection);
    if (!filtered.length) return null;
    const courseGroups = filtered.reduce((acc, row) => {
      const courseName = normalizeCourseName(row.course, semester);
      if (!acc[courseName]) acc[courseName] = [];
      acc[courseName].push(row);
      return acc;
    }, {});
    const courses = Object.keys(courseGroups).sort();
    const lec = filtered.filter(d => d.session_type === 'LECTURE');
    const prac = filtered.filter(d => d.session_type === 'PRACTICE');
    const exam = filtered.filter(d => d.session_type === 'EXAM');
    const sum = (a, k) => a.reduce((s, d) => s + (d[k] || 0), 0);
    const avg = (a, k) => a.length ? sum(a, k) / a.length : 0;
    return {
      courses, courseCount: courses.length,
      courseGroups,
      lectureCount: sum(lec, 'sessions'),
      practiceCount: sum(prac, 'sessions'),
      examCount: sum(exam, 'sessions'),
      totalSessions: sum(filtered, 'sessions'),
      classSize: Math.max(...filtered.map(d => d.students), 0),
      overallCompletion: avg(filtered, 'completion'),
      lectureCompletion: avg(lec, 'completion'),
      practiceCompletion: avg(prac, 'completion'),
      examCompletion: avg(exam, 'completion'),
      avgTime: sum(filtered, 'avg_time'),
      p80Time: sum(filtered, 'p80_time'),
      practiceAvgTime: sum(prac, 'avg_time'),
      practiceP80Time: sum(prac, 'p80_time'),
      filtered,
    };
  }, [data, selectedInstitute, selectedSection]);

  if (!metrics) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No data</p>
          <button onClick={onBack} className="text-blue-500 hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const dates = getSemesterDatesForInstitute(selectedInstitute, semester);

  // Theme helpers
  const pageBg = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const cardBgNoB = isDark ? 'bg-slate-800' : 'bg-white';
  const headingColor = isDark ? 'text-slate-200' : 'text-gray-700';
  const subColor = isDark ? 'text-slate-400' : 'text-gray-600';
  const muted = isDark ? 'text-slate-500' : 'text-gray-500';
  const bodyText = isDark ? 'text-slate-100' : 'text-gray-900';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-100';
  const statAccentBg = isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100';
  const statGrayBg = isDark ? 'bg-slate-700' : 'bg-gray-100';
  const completionBg = isDark ? 'bg-slate-700' : 'bg-gray-50';
  const tableBg = isDark ? 'bg-slate-800' : 'bg-white';
  const tableHeaderBg = isDark ? 'bg-slate-700' : 'bg-gray-50';
  const tableHeaderText = isDark ? 'text-slate-400' : 'text-gray-500';
  const tableRowHover = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50/30';
  const tableRowDivide = isDark ? 'divide-slate-700' : 'divide-gray-50';
  const tableCellSticky = isDark
    ? 'bg-slate-800 hover:bg-slate-700/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]'
    : 'bg-white hover:bg-indigo-50/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]';
  const tableStickyHeader = isDark
    ? 'bg-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]'
    : 'bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]';
  const backBtnCls = isDark
    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100';

  const SidebarContent = () => (
    <>
      <h3 className={`text-sm font-semibold mb-4 ${headingColor}`}>Semester Timeline</h3>
      {dates ? (
        <div className="space-y-3">
          <div className={`rounded-lg p-4 border ${isDark ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className={`text-xs font-medium uppercase mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Start Date</p>
            <p className={`text-lg font-bold ${bodyText}`}>{dates.start}</p>
          </div>
          <div className={`rounded-lg p-4 border ${isDark ? 'bg-rose-900/30 border-rose-700/50' : 'bg-rose-50 border-rose-100'}`}>
            <p className={`text-xs font-medium uppercase mb-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>End Date</p>
            <p className={`text-lg font-bold ${bodyText}`}>{dates.end}</p>
          </div>
        </div>
      ) : (
        <p className={`text-sm italic ${muted}`}>Dates not available</p>
      )}
      <div className={`mt-5 pt-5 border-t ${borderColor}`}>
        <h4 className={`text-xs font-semibold uppercase mb-3 ${muted}`}>Quick Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={subColor}>Courses</span>
            <span className={`font-semibold ${bodyText}`}>{metrics.courseCount}</span>
          </div>
          <div className="flex justify-between">
            <span className={subColor}>Students</span>
            <span className={`font-semibold ${bodyText}`}>{r2(metrics.classSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className={subColor}>Total Sessions</span>
            <span className={`font-semibold ${bodyText}`}>{r2(metrics.totalSessions)}</span>
          </div>
        </div>
      </div>
      {assessmentMetrics && (
        <div className={`mt-5 pt-5 border-t ${borderColor}`}>
          <h4 className={`text-xs font-semibold uppercase mb-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Assessment Summary</h4>
          <div className="space-y-3">
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-purple-900/30 border-purple-700/50' : 'bg-purple-50 border-purple-100'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Avg Score</p>
              <p className={`text-xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {(assessmentMetrics.overallScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-indigo-900/30 border-indigo-700/50' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Avg Participation</p>
              <p className={`text-xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {assessmentMetrics.overallParticipation.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AnimatedView>
      <div className={`min-h-screen ${pageBg} p-4 sm:p-5`}>
        {/* Top bar */}
        <div className="max-w-7xl mx-auto mb-5">
          <button
            onClick={onBack}
            onMouseDown={addRipple}
            className={`ripple-btn touch-target flex items-center gap-2 mb-4 -ml-1 px-2 rounded-lg transition-colors ${backBtnCls}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Series
          </button>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className={`text-base font-semibold truncate ${bodyText}`}>{selectedInstitute}</span>
              {sections.length > 0 && (
                <>
                  <span className={subColor}>—</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`${isDark ? 'styled-select-dark' : 'styled-select'} text-base font-semibold border rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 hover:border-indigo-300 transition-colors min-h-[36px] ${
                      isDark
                        ? 'bg-slate-700 text-slate-100 border-slate-600'
                        : 'bg-transparent text-gray-800 border-gray-200'
                    }`}
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              )}
            </div>
            <button
              onClick={onReset}
              onMouseDown={addRipple}
              className={`ripple-btn touch-target text-sm flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${
                isDark
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              New Upload
            </button>
          </div>
        </div>

        {/* Mobile collapsible sidebar */}
        <div className="max-w-7xl mx-auto lg:hidden mb-4">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl shadow-sm border text-sm font-medium touch-target ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-white border-gray-100 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline &amp; Quick Stats
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${sidebarExpanded ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sidebarExpanded && (
            <div className={`mt-2 rounded-xl shadow-sm p-5 border animate-fade-slide-up ${cardBg}`}>
              <SidebarContent />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto flex gap-5">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className={`rounded-xl shadow-sm p-5 sticky top-5 border ${cardBg}`}>
              <SidebarContent />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-12 gap-5">
              {/* Sessions mix */}
              <div className="col-span-12 md:col-span-3 space-y-5">
                <div className={`rounded-xl p-5 shadow-sm border ${cardBg}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${headingColor}`}>Sessions mix</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={subColor}>Lecture</span>
                      <span className={`text-lg font-bold ${bodyText}`}>{r2(metrics.lectureCount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={subColor}>Practice</span>
                      <span className={`text-lg font-bold ${bodyText}`}>{r2(metrics.practiceCount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={subColor}>Exam</span>
                      <span className={`text-lg font-bold ${bodyText}`}>{r2(metrics.examCount)}</span>
                    </div>
                  </div>
                </div>
                <div className={`rounded-xl p-5 border ${statAccentBg}`}>
                  <p className={`text-xs uppercase font-medium mb-1 ${muted}`}>TOTAL SESSIONS</p>
                  <p className={`text-4xl font-bold ${bodyText}`}>{r2(metrics.totalSessions)}</p>
                </div>
                <div className={`rounded-xl p-5 ${statGrayBg}`}>
                  <p className={`text-xs uppercase font-medium mb-1 ${muted}`}>CLASS SIZE</p>
                  <p className={`text-4xl font-bold ${bodyText}`}>{r2(metrics.classSize)}</p>
                </div>
              </div>

              {/* Completion */}
              <div className="col-span-12 md:col-span-5 space-y-5">
                <div className={`rounded-xl p-5 shadow-sm border ${cardBg}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${headingColor}`}>Completion</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-xl p-4 text-center ${completionBg}`}>
                      <p className={`text-xs mb-2 ${muted}`}>Overall</p>
                      <p className={`text-2xl font-bold ${bodyText}`}>{metrics.overallCompletion.toFixed(1)}%</p>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${completionBg}`}>
                      <p className={`text-xs mb-2 ${muted}`}>Lecture</p>
                      <p className={`text-2xl font-bold ${bodyText}`}>{metrics.lectureCompletion.toFixed(1)}%</p>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${completionBg}`}>
                      <p className={`text-xs mb-2 ${muted}`}>Practice</p>
                      <p className={`text-2xl font-bold ${bodyText}`}>{metrics.practiceCompletion.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-xl p-5 shadow-sm border ${cardBg}`}>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <DonutChart value={metrics.examCompletion} size={90} strokeWidth={10} color="#f59e0b" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${bodyText}`}>{metrics.examCompletion.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${bodyText}`}>Exam</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workload */}
              <div className="col-span-12 md:col-span-4">
                <div className={`rounded-xl p-5 shadow-sm h-full border ${cardBg}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${headingColor}`}>Workload (per-student)</h3>
                  <WorkloadBar label="Avg" value={metrics.avgTime} maxValue={500} color="#ef4444" />
                  <WorkloadBar label="P80" value={metrics.p80Time} maxValue={500} color="#f97316" />
                  <WorkloadBar label="Practice" value={metrics.practiceAvgTime} maxValue={200} color="#fbbf24" />
                  <WorkloadBar label="Practice (P80)" value={metrics.practiceP80Time} maxValue={200} color="#fcd34d" />
                </div>
              </div>
            </div>

            {/* Course-wise Breakdown */}
            <div
              className={`mt-5 rounded-xl shadow-sm overflow-hidden animate-fade-slide-up border ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
              style={{ animationDelay: '0.12s' }}
            >
              <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}`}>
                <h3 className={`text-sm font-semibold ${headingColor}`}>Course-wise Breakdown</h3>
                <span className={`text-xs sm:hidden ${muted}`}>← scroll →</span>
              </div>
              <div className="table-scroll-container overflow-x-auto">
                <table className={`w-full min-w-[780px] ${tableBg}`}>
                  <thead className={tableHeaderBg}>
                    <tr className={`text-xs uppercase tracking-wider ${tableHeaderText}`}>
                      <th className={`text-left px-4 py-3 font-medium sticky left-0 z-10 ${tableStickyHeader}`}>Course</th>
                      <th className={`text-center px-2 py-3 font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>Lec</th>
                      <th className={`text-center px-2 py-3 font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Prac</th>
                      <th className={`text-center px-2 py-3 font-medium ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>Exam</th>
                      <th className="text-center px-2 py-3 font-medium">Total</th>
                      <th className="text-center px-2 py-3 font-medium">Lec %</th>
                      <th className="text-center px-2 py-3 font-medium">Prac %</th>
                      <th className="text-center px-2 py-3 font-medium">Exam %</th>
                      <th className={`text-center px-2 py-3 font-medium ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>Score %</th>
                      <th className={`text-center px-2 py-3 font-medium ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>Particip #</th>
                      <th className="text-center px-2 py-3 font-medium">Avg Time</th>
                      <th className="text-center px-2 py-3 font-medium">P80 Time</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${tableRowDivide}`}>
                    {metrics.courses.map((course) => {
                      const displayName = course;
                      const cd = metrics.courseGroups[course] || [];
                      const l = cd.find(d => d.session_type === 'LECTURE');
                      const p = cd.find(d => d.session_type === 'PRACTICE');
                      const e = cd.find(d => d.session_type === 'EXAM');
                      const lc = l?.sessions || 0, pc = p?.sessions || 0, ec = e?.sessions || 0;
                      const total = lc + pc + ec;
                      const avgT = cd.reduce((s, d) => s + d.avg_time, 0);
                      const p80T = cd.reduce((s, d) => s + d.p80_time, 0);
                      const ca = assessmentMetrics?.courses.find(c => c.name === displayName);
                      return (
                        <tr key={course} className={`transition-colors ${tableRowHover}`}>
                          <td className={`px-4 py-3 text-sm font-medium sticky left-0 z-10 whitespace-nowrap max-w-[180px] truncate ${tableCellSticky} ${isDark ? 'text-slate-200' : 'text-gray-800'}`} title={displayName}>
                            {displayName}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{r2(lc)}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{r2(pc)}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded ${isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>{r2(ec)}</span>
                          </td>
                          <td className={`px-2 py-3 text-sm text-center font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{r2(total)}</td>
                          <td className={`px-2 py-3 text-center text-sm ${isDark ? 'text-slate-300' : ''}`}>{l ? `${l.completion.toFixed(1)}%` : '—'}</td>
                          <td className={`px-2 py-3 text-center text-sm ${isDark ? 'text-slate-300' : ''}`}>{p ? `${p.completion.toFixed(1)}%` : '—'}</td>
                          <td className={`px-2 py-3 text-center text-sm ${isDark ? 'text-slate-300' : ''}`}>{e ? `${e.completion.toFixed(1)}%` : '—'}</td>
                          <td className={`px-2 py-3 text-center text-sm font-semibold ${isDark ? 'text-purple-300 bg-purple-900/20' : 'text-purple-700 bg-purple-50/30'}`}>
                            {ca ? `${(ca.avgScore * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td className={`px-2 py-3 text-center text-sm font-semibold ${isDark ? 'text-indigo-300 bg-indigo-900/20' : 'text-indigo-700 bg-indigo-50/30'}`}>
                            {ca ? `${ca.avgParticipation.toFixed(0)}` : '—'}
                          </td>
                          <td className={`px-2 py-3 text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{avgT.toFixed(1)}h</td>
                          <td className={`px-2 py-3 text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{p80T.toFixed(1)}h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </AnimatedView>
  );
}
