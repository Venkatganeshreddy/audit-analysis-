import { getAllottedHours } from '../utils';

const RecommendationAgent = {
  generate(seriesData, semester) {
    if (!seriesData) return [];
    const recs = [];
    const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
    allUnivs.forEach(u => {
      const allotted = getAllottedHours(u.name, semester);
      if (u.avgPracticeCompletion < 40) { recs.push({ university: u.name, priority: 'high', icon: '🎯', title: 'Boost Practice Engagement', action: `Schedule dedicated practice hours for ${u.name}. Current practice completion is ${u.avgPracticeCompletion.toFixed(1)}%.`, impact: 'Could improve assessment scores by 10-15%.', category: 'engagement' }); }
      if (allotted && u.avgSessions / allotted < 0.6) { const gap = allotted - u.avgSessions; recs.push({ university: u.name, priority: 'critical', icon: '🚨', title: 'Delivery Catch-Up Required', action: `${u.name} needs ~${gap.toFixed(0)} more sessions to meet allotted ${allotted} hours.`, impact: `Currently at ${(u.avgSessions / allotted * 100).toFixed(0)}% delivery.`, category: 'delivery' }); }
      if (u.avgLectureCompletion > 70 && u.avgPracticeCompletion < 40) { recs.push({ university: u.name, priority: 'medium', icon: '⚖️', title: 'Rebalance Session Types', action: `${u.name}: Convert some lecture slots to guided practice. Lecture (${u.avgLectureCompletion.toFixed(1)}%) is strong but practice (${u.avgPracticeCompletion.toFixed(1)}%) needs work.`, impact: 'Balanced delivery typically yields 20% better outcomes.', category: 'curriculum' }); }
    });
    const topPerformers = [...allUnivs].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion).slice(0, 3);
    if (topPerformers.length > 0 && allUnivs.length > 5) {
      const avgPracticeRatio = topPerformers.reduce((s, u) => s + (u.avgPracticeCompletion / Math.max(u.avgLectureCompletion, 1)), 0) / topPerformers.length;
      recs.push({ university: 'Network-wide', priority: 'info', icon: '💡', title: 'Best Practice: Top Performer Pattern', action: `Top performers (${topPerformers.map(u => u.name).join(', ')}) maintain a practice-to-lecture ratio of ${(avgPracticeRatio * 100).toFixed(0)}%.`, impact: 'Replicating top performer patterns across the network.', category: 'best-practice' });
    }
    return recs.sort((a, b) => { const order = { critical: 0, high: 1, medium: 2, info: 3 }; return (order[a.priority] ?? 3) - (order[b.priority] ?? 3); });
  }
};

export default RecommendationAgent;
