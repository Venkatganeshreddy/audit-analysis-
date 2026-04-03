const MonitoringAgent = {
  check(seriesData, data, semester) {
    if (!seriesData || !data) return { alerts: [], kpis: {} };
    const alerts = [];
    const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
    if (!allUnivs.length) return { alerts: [], kpis: {} };
    const totalStudents = allUnivs.reduce((s, u) => s + Math.round(u.avgClassSize * u.sectionCount), 0);
    const avgCompletion = allUnivs.reduce((s, u) => s + u.avgOverallCompletion, 0) / allUnivs.length;
    const avgPractice = allUnivs.reduce((s, u) => s + u.avgPracticeCompletion, 0) / allUnivs.length;
    const withScores = allUnivs.filter(u => u.avgAssessmentScore !== null);
    const avgScore = withScores.length ? withScores.reduce((s, u) => s + u.avgAssessmentScore, 0) / withScores.length : null;
    const criticalCount = allUnivs.filter(u => u.avgOverallCompletion < 40).length;
    const healthyCount = allUnivs.filter(u => u.avgOverallCompletion > 70).length;
    const kpis = { totalUniversities: allUnivs.length, totalStudents, avgCompletion, avgPractice, avgScore, criticalCount, healthyCount, healthRate: (healthyCount / allUnivs.length) * 100 };
    if (criticalCount > 0) alerts.push({ severity: 'critical', icon: '🔴', message: `${criticalCount} universit${criticalCount === 1 ? 'y has' : 'ies have'} overall completion below 40%`, count: criticalCount });
    if (avgPractice < 45) alerts.push({ severity: 'warning', icon: '🟡', message: `Network-wide practice completion is low at ${avgPractice.toFixed(1)}%` });
    const institutes = [...new Set(data.map(d => d.institute))];
    const zeroPractice = [];
    institutes.forEach(inst => {
      const courses = [...new Set(data.filter(d => d.institute === inst).map(d => d.course))];
      courses.forEach(course => {
        const prac = data.find(d => d.institute === inst && d.course === course && d.session_type === 'PRACTICE');
        if (!prac || prac.sessions === 0) zeroPractice.push({ institute: inst, course });
      });
    });
    if (zeroPractice.length > 0) alerts.push({ severity: 'warning', icon: '🟠', message: `${zeroPractice.length} course-university combinations have zero practice sessions`, details: zeroPractice.slice(0, 5) });
    if (healthyCount === allUnivs.length) alerts.push({ severity: 'success', icon: '🟢', message: 'All universities are above 70% overall completion — excellent network health!' });
    return { alerts, kpis };
  }
};

export default MonitoringAgent;
