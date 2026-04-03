import { AGENT_CONFIG } from '../constants';
import { getAllottedHours } from '../utils';

const InsightAgent = {
  analyze(seriesData, data, assessmentData, semester) {
    if (!seriesData || !data) return { insights: [], summary: '' };
    const insights = [];
    const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
    if (!allUnivs.length) return { insights: [], summary: 'No university data available.' };

    const sorted = [...allUnivs].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion);
    if (sorted.length >= 2) {
      const top = sorted[0], bottom = sorted[sorted.length - 1];
      insights.push({ type: 'performer', severity: 'info', icon: '🏆', title: 'Top Performer', text: `${top.name} leads with ${top.avgOverallCompletion.toFixed(1)}% overall completion across ${top.sectionCount} section(s).`, metric: top.avgOverallCompletion });
      if (bottom.avgOverallCompletion < AGENT_CONFIG.thresholds.overallCompletionLow) {
        insights.push({ type: 'performer', severity: 'critical', icon: '⚠️', title: 'Needs Attention', text: `${bottom.name} has the lowest completion at ${bottom.avgOverallCompletion.toFixed(1)}%. Immediate intervention recommended.`, metric: bottom.avgOverallCompletion });
      }
    }

    const lowPractice = allUnivs.filter(u => u.avgPracticeCompletion < AGENT_CONFIG.thresholds.practiceCompletionLow);
    if (lowPractice.length > 0) {
      insights.push({ type: 'gap', severity: 'warning', icon: '🔧', title: `Practice Gap: ${lowPractice.length} universit${lowPractice.length === 1 ? 'y' : 'ies'}`, text: `${lowPractice.map(u => u.name).join(', ')} ha${lowPractice.length === 1 ? 's' : 've'} practice completion below ${AGENT_CONFIG.thresholds.practiceCompletionLow}%.`, universities: lowPractice.map(u => u.name) });
    }

    allUnivs.forEach(u => {
      if (u.avgLectureCompletion > 0 && u.avgPracticeCompletion > 0) {
        const ratio = u.avgPracticeCompletion / u.avgLectureCompletion;
        if (ratio < 0.6) {
          insights.push({ type: 'imbalance', severity: 'warning', icon: '⚖️', title: `Lecture-Practice Imbalance: ${u.name}`, text: `Lecture completion (${u.avgLectureCompletion.toFixed(1)}%) far exceeds practice (${u.avgPracticeCompletion.toFixed(1)}%).`, university: u.name });
        }
      }
    });

    allUnivs.forEach(u => {
      const allotted = getAllottedHours(u.name, semester);
      if (allotted && u.avgSessions > 0) {
        const deliveryRatio = u.avgSessions / allotted;
        if (deliveryRatio < AGENT_CONFIG.thresholds.deliveryRatioLow) {
          insights.push({ type: 'delivery', severity: 'critical', icon: '📉', title: `Low Delivery: ${u.name}`, text: `Only ${(deliveryRatio * 100).toFixed(0)}% of allotted ${allotted} hours delivered (${u.avgSessions.toFixed(0)} sessions). Risk of not completing curriculum.`, university: u.name, metric: deliveryRatio });
        }
      }
    });

    const withScores = allUnivs.filter(u => u.avgAssessmentScore !== null && u.avgPracticeCompletion > 0);
    if (withScores.length >= 3) {
      const highPractice = withScores.filter(u => u.avgPracticeCompletion > 60);
      const lowPrac = withScores.filter(u => u.avgPracticeCompletion <= 40);
      if (highPractice.length > 0 && lowPrac.length > 0) {
        const avgScoreHigh = highPractice.reduce((s, u) => s + u.avgAssessmentScore, 0) / highPractice.length;
        const avgScoreLow = lowPrac.reduce((s, u) => s + u.avgAssessmentScore, 0) / lowPrac.length;
        if (avgScoreHigh > avgScoreLow) {
          insights.push({ type: 'correlation', severity: 'info', icon: '📊', title: 'Practice ↔ Score Correlation', text: `Universities with >60% practice completion average ${(avgScoreHigh * 100).toFixed(1)}% assessment score vs ${(avgScoreLow * 100).toFixed(1)}% for those below 40%.` });
        }
      }
    }

    const seriesCounts = Object.entries(seriesData).filter(([, v]) => v.universities.length > 0);
    if (seriesCounts.length > 0) {
      const maxSeries = seriesCounts.reduce((a, b) => b[1].universities.length > a[1].universities.length ? b : a);
      if (maxSeries[1].universities.length > allUnivs.length * 0.5) {
        insights.push({ type: 'distribution', severity: 'info', icon: '📐', title: 'Series Concentration', text: `${maxSeries[1].universities.length} of ${allUnivs.length} universities (${((maxSeries[1].universities.length / allUnivs.length) * 100).toFixed(0)}%) are in the ${maxSeries[0]} series.` });
      }
    }

    const avgOverall = allUnivs.reduce((s, u) => s + u.avgOverallCompletion, 0) / allUnivs.length;
    const summary = `Analyzing ${allUnivs.length} universities across ${seriesCounts.length} active series. Network average completion: ${avgOverall.toFixed(1)}%. ${insights.filter(i => i.severity === 'critical').length} critical issues, ${insights.filter(i => i.severity === 'warning').length} warnings detected.`;
    return { insights: insights.sort((a, b) => { const order = { critical: 0, warning: 1, info: 2, success: 3 }; return (order[a.severity] ?? 3) - (order[b.severity] ?? 3); }), summary };
  }
};

export default InsightAgent;
