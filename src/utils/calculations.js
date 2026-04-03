import { SERIES_RANGES } from '../constants';
import { getAllottedHours, getSeriesForAllottedHours, getSeriesForValue } from './semesterHelpers';

export const calcUnivAssessment = (assessmentData, univName) => {
  if (!assessmentData) return { avgScore: null, avgParticipation: null };
  const univData = assessmentData.filter(d => d.university === univName);
  if (!univData.length) return { avgScore: null, avgParticipation: null };
  const sections = [...new Set(univData.map(d => d.section).filter(Boolean))];
  if (sections.length <= 1) {
    return { avgScore: univData.reduce((s, d) => s + d.avg_score, 0) / univData.length, avgParticipation: univData.reduce((s, d) => s + d.avg_participation, 0) / univData.length };
  }
  const sectionCourses = sections.map(sec => new Set(univData.filter(d => d.section === sec).map(d => d.course_code)));
  let commonCourses = [...sectionCourses[0]];
  for (let i = 1; i < sectionCourses.length; i++) commonCourses = commonCourses.filter(c => sectionCourses[i].has(c));
  if (!commonCourses.length) return { avgScore: null, avgParticipation: null };
  const sectionAvgs = sections.map(sec => {
    const secData = univData.filter(d => d.section === sec && commonCourses.includes(d.course_code));
    return { score: secData.reduce((s, d) => s + d.avg_score, 0) / secData.length, participation: secData.reduce((s, d) => s + d.avg_participation, 0) / secData.length };
  });
  return { avgScore: sectionAvgs.reduce((s, a) => s + a.score, 0) / sectionAvgs.length, avgParticipation: sectionAvgs.reduce((s, a) => s + a.participation, 0) / sectionAvgs.length };
};

export const calculateSeriesData = (data, assessmentData, analysisType = 'design', semester) => {
  const institutes = [...new Set(data.map(d => d.institute))];
  const univMetrics = institutes.map(inst => {
    const instData = data.filter(d => d.institute === inst);
    const sections = [...new Set(instData.map(d => d.section).filter(Boolean))];
    const calcSectionMetric = (secData) => {
      const lec = secData.filter(d => d.session_type === 'LECTURE');
      const prac = secData.filter(d => d.session_type === 'PRACTICE');
      const exam = secData.filter(d => d.session_type === 'EXAM');
      const sum = (a, k) => a.reduce((s, d) => s + (d[k] || 0), 0);
      const avg = (a, k) => a.length ? sum(a, k) / a.length : 0;
      // Get max sessions value per session type (representative delivered count)
      const lecSessions = lec.length ? Math.max(...lec.map(d => d.sessions || 0)) : 0;
      const pracSessions = prac.length ? Math.max(...prac.map(d => d.sessions || 0)) : 0;
      const examSessions = exam.length ? Math.max(...exam.map(d => d.sessions || 0)) : 0;
      const totalSessions = lecSessions + pracSessions + examSessions;
      return {
        totalSessions,
        classSize: Math.max(...secData.map(d => d.students || 0), 0),
        lectureCompletion: avg(lec, 'completion'),
        practiceCompletion: avg(prac, 'completion'),
        examCompletion: avg(exam, 'completion'),
        avgTime: sum(secData, 'avg_time'),
        p80Time: sum(secData, 'p80_time'),
        practiceAvgTime: sum(prac, 'avg_time'),
        practiceP80Time: sum(prac, 'p80_time'),
      };
    };
    const sectionMetrics = sections.length > 0
      ? sections.map(sec => ({ section: sec, ...calcSectionMetric(instData.filter(d => d.section === sec)) }))
      : [{ section: 'All', ...calcSectionMetric(instData) }];
    const n = sectionMetrics.length;
    const avg = (k) => sectionMetrics.reduce((s, m) => s + m[k], 0) / n;
    const { avgScore, avgParticipation } = calcUnivAssessment(assessmentData, inst);
    const allottedHours = getAllottedHours(inst, semester);
    let seriesName;
    if (analysisType === 'design') {
      const seriesInfo = getSeriesForAllottedHours(inst, semester);
      seriesName = seriesInfo ? seriesInfo.name : 'Unknown';
    } else {
      seriesName = getSeriesForValue(avg('totalSessions')).name;
    }
    return { name: inst, sectionCount: sections.length || 1, avgSessions: avg('totalSessions'), avgClassSize: avg('classSize'), avgLectureCompletion: avg('lectureCompletion'), avgPracticeCompletion: avg('practiceCompletion'), avgExamCompletion: avg('examCompletion'), avgOverallCompletion: (avg('lectureCompletion') + avg('practiceCompletion') + avg('examCompletion')) / 3, avgWorkload: avg('avgTime'), avgP80Workload: avg('p80Time'), avgPracticeWorkload: avg('practiceAvgTime'), avgPracticeP80Workload: avg('practiceP80Time'), series: seriesName, allottedHours, avgAssessmentScore: avgScore, avgParticipation };
  });

  const seriesData = {};
  SERIES_RANGES.forEach(s => {
    const univs = univMetrics.filter(u => u.series === s.name);
    if (!univs.length) { seriesData[s.name] = { universities: [], avgSessions: 0, avgClassSize: 0, avgLectureCompletion: 0, avgPracticeCompletion: 0, avgExamCompletion: 0, avgOverallCompletion: 0, avgWorkload: 0, avgP80Workload: 0, avgPracticeWorkload: 0, avgPracticeP80Workload: 0, totalStudents: 0, avgAssessmentScore: null, avgParticipation: null, avgAllottedHours: 0 }; return; }
    const avg = (k) => univs.reduce((s, u) => s + u[k], 0) / univs.length;
    const univsWithScore = univs.filter(u => u.avgAssessmentScore !== null);
    const univsWithAllotted = univs.filter(u => u.allottedHours !== null);
    seriesData[s.name] = { universities: univs, avgSessions: avg('avgSessions'), avgClassSize: avg('avgClassSize'), avgLectureCompletion: avg('avgLectureCompletion'), avgPracticeCompletion: avg('avgPracticeCompletion'), avgExamCompletion: avg('avgExamCompletion'), avgOverallCompletion: avg('avgOverallCompletion'), avgWorkload: avg('avgWorkload'), avgP80Workload: avg('avgP80Workload'), avgPracticeWorkload: avg('avgPracticeWorkload'), avgPracticeP80Workload: avg('avgPracticeP80Workload'), totalStudents: univs.reduce((s, u) => s + Math.round(u.avgClassSize * u.sectionCount), 0), avgAssessmentScore: univsWithScore.length ? univsWithScore.reduce((s, u) => s + u.avgAssessmentScore, 0) / univsWithScore.length : null, avgParticipation: univsWithScore.length ? univsWithScore.reduce((s, u) => s + u.avgParticipation, 0) / univsWithScore.length : null, avgAllottedHours: univsWithAllotted.length ? univsWithAllotted.reduce((s, u) => s + u.allottedHours, 0) / univsWithAllotted.length : 0 };
  });

  if (analysisType === 'design') {
    const unknownUnivs = univMetrics.filter(u => u.series === 'Unknown');
    if (unknownUnivs.length > 0) seriesData['Unknown'] = { universities: unknownUnivs, avgSessions: unknownUnivs.reduce((s, u) => s + u.avgSessions, 0) / unknownUnivs.length, avgClassSize: unknownUnivs.reduce((s, u) => s + u.avgClassSize, 0) / unknownUnivs.length, avgLectureCompletion: 0, avgPracticeCompletion: 0, avgExamCompletion: 0, avgOverallCompletion: 0, avgWorkload: 0, avgP80Workload: 0, avgPracticeWorkload: 0, avgPracticeP80Workload: 0, totalStudents: 0, avgAssessmentScore: null, avgParticipation: null, avgAllottedHours: 0 };
  }
  return seriesData;
};
