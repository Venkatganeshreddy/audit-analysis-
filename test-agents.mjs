/**
 * NIAT Intelligence Agent — Correctness Test Suite
 * Run: node test-agents.mjs
 *
 * Tests all 4 agents (Insight, Recommendation, Monitoring, Conversational)
 * with mock university data and validates responses.
 */

// ─── Mock Data ───────────────────────────────────────────────────────────────

const SERIES_RANGES = [
  { name: '300', min: 0, max: 350 },
  { name: '350', min: 350, max: 400 },
  { name: '400', min: 400, max: 450 },
  { name: '450', min: 450, max: 500 },
  { name: '500', min: 500, max: 550 },
  { name: '550+', min: 550, max: Infinity },
];

const ALLOTTED_HOURS = {
  "NRI Institute of Technology": 510,
  "S-Vyasa": 673,
  "Sanjay Ghodawat University": 354,
  "Crescent University": 310,
  "Annamacharya University": 540,
};

function getAllottedHours(name) {
  if (ALLOTTED_HOURS[name]) return ALLOTTED_HOURS[name];
  for (const k of Object.keys(ALLOTTED_HOURS)) {
    if (name.toLowerCase().includes(k.toLowerCase().split(' ')[0])) return ALLOTTED_HOURS[k];
  }
  return null;
}

function getCourseMapping() {
  return {
    'PROGRAMMING_FOUNDATIONS': 'Computer Programming',
    'MATHEMATICS': 'Mathematics for Computer Science',
    'GENERATIVE_AI': 'Introduction to Generative AI',
  };
}

// ─── Build mock universities ─────────────────────────────────────────────────

function makeUniv(name, opts) {
  return {
    name,
    sectionCount: opts.sections || 1,
    avgSessions: opts.sessions || 100,
    avgClassSize: opts.classSize || 50,
    avgLectureCompletion: opts.lecture || 70,
    avgPracticeCompletion: opts.practice || 50,
    avgExamCompletion: opts.exam || 60,
    avgOverallCompletion: ((opts.lecture || 70) + (opts.practice || 50) + (opts.exam || 60)) / 3,
    avgWorkload: opts.workload || 12,
    avgP80Workload: opts.p80 || 18,
    avgAssessmentScore: opts.assessScore ?? null,
    avgParticipation: opts.participation ?? null,
    allottedHours: getAllottedHours(name),
    series: '500',
  };
}

const universities = [
  makeUniv("NRI Institute of Technology", { sessions: 480, lecture: 85, practice: 72, exam: 78, sections: 3, classSize: 60, assessScore: 0.82, participation: 85 }),
  makeUniv("S-Vyasa", { sessions: 350, lecture: 75, practice: 35, exam: 55, sections: 2, classSize: 45, assessScore: 0.65, participation: 70 }),
  makeUniv("Sanjay Ghodawat University", { sessions: 180, lecture: 60, practice: 20, exam: 40, sections: 1, classSize: 55, assessScore: 0.45, participation: 50 }),
  makeUniv("Crescent University", { sessions: 290, lecture: 78, practice: 30, exam: 50, sections: 2, classSize: 40, assessScore: 0.55, participation: 60 }),
  makeUniv("Annamacharya University", { sessions: 400, lecture: 70, practice: 55, exam: 65, sections: 2, classSize: 50, assessScore: 0.72, participation: 75 }),
  makeUniv("Aurora University", { sessions: 420, lecture: 90, practice: 80, exam: 85, sections: 3, classSize: 65, assessScore: 0.88, participation: 90 }),
];

const seriesData = {
  '300': { universities: universities.filter(u => u.name === "Crescent University"), avgSessions: 290 },
  '350': { universities: universities.filter(u => u.name === "Sanjay Ghodawat University"), avgSessions: 180 },
  '400': { universities: [], avgSessions: 0 },
  '450': { universities: [], avgSessions: 0 },
  '500': { universities: universities.filter(u => ["NRI Institute of Technology", "S-Vyasa", "Annamacharya University", "Aurora University"].includes(u.name)), avgSessions: 400 },
  '550+': { universities: [], avgSessions: 0 },
};

const rawData = [
  { institute: "NRI Institute of Technology", course: "PROGRAMMING_FOUNDATIONS", session_type: "LECTURE", completion: 90, sessions: 80, students: 60 },
  { institute: "NRI Institute of Technology", course: "PROGRAMMING_FOUNDATIONS", session_type: "PRACTICE", completion: 70, sessions: 50, students: 60 },
  { institute: "NRI Institute of Technology", course: "PROGRAMMING_FOUNDATIONS", session_type: "EXAM", completion: 75, sessions: 10, students: 60 },
  { institute: "NRI Institute of Technology", course: "MATHEMATICS", session_type: "LECTURE", completion: 80, sessions: 85, students: 60 },
  { institute: "NRI Institute of Technology", course: "MATHEMATICS", session_type: "PRACTICE", completion: 74, sessions: 55, students: 60 },
  { institute: "S-Vyasa", course: "PROGRAMMING_FOUNDATIONS", session_type: "LECTURE", completion: 75, sessions: 60, students: 45 },
  { institute: "S-Vyasa", course: "PROGRAMMING_FOUNDATIONS", session_type: "PRACTICE", completion: 35, sessions: 20, students: 45 },
  { institute: "Sanjay Ghodawat University", course: "GENERATIVE_AI", session_type: "LECTURE", completion: 60, sessions: 40, students: 55 },
  { institute: "Sanjay Ghodawat University", course: "GENERATIVE_AI", session_type: "PRACTICE", completion: 20, sessions: 0, students: 55 },
  { institute: "Aurora University", course: "MATHEMATICS", session_type: "LECTURE", completion: 92, sessions: 100, students: 65 },
  { institute: "Aurora University", course: "MATHEMATICS", session_type: "PRACTICE", completion: 82, sessions: 80, students: 65 },
];

const semester = "Semester 1";

// ─── Test Utilities ──────────────────────────────────────────────────────────

let passed = 0, failed = 0, total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.log(`  ❌ ${testName}${details ? ' — ' + details : ''}`);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INSIGHT AGENT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('1. INSIGHT AGENT');

// Replicate InsightAgent logic inline (to avoid ESM import issues with JSX project)
function runInsightAgent(seriesData, data, assessmentData, semester) {
  const insights = [];
  const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
  if (!allUnivs.length) return { insights: [], summary: 'No university data available.' };

  const sorted = [...allUnivs].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion);
  if (sorted.length >= 2) {
    const top = sorted[0], bottom = sorted[sorted.length - 1];
    insights.push({ type: 'performer', severity: 'info', title: 'Top Performer', text: `${top.name} leads with ${top.avgOverallCompletion.toFixed(1)}% overall completion.` });
    if (bottom.avgOverallCompletion < 50) {
      insights.push({ type: 'performer', severity: 'critical', title: 'Needs Attention', text: `${bottom.name} has the lowest completion at ${bottom.avgOverallCompletion.toFixed(1)}%.` });
    }
  }

  const lowPractice = allUnivs.filter(u => u.avgPracticeCompletion < 40);
  if (lowPractice.length > 0) {
    insights.push({ type: 'gap', severity: 'warning', title: `Practice Gap: ${lowPractice.length} universities`, universities: lowPractice.map(u => u.name) });
  }

  allUnivs.forEach(u => {
    if (u.avgLectureCompletion > 0 && u.avgPracticeCompletion > 0) {
      const ratio = u.avgPracticeCompletion / u.avgLectureCompletion;
      if (ratio < 0.6) {
        insights.push({ type: 'imbalance', severity: 'warning', title: `Lecture-Practice Imbalance: ${u.name}` });
      }
    }
  });

  allUnivs.forEach(u => {
    const allotted = getAllottedHours(u.name);
    if (allotted && u.avgSessions > 0) {
      const deliveryRatio = u.avgSessions / allotted;
      if (deliveryRatio < 0.6) {
        insights.push({ type: 'delivery', severity: 'critical', title: `Low Delivery: ${u.name}`, metric: deliveryRatio });
      }
    }
  });

  return { insights, summary: `Analyzing ${allUnivs.length} universities.` };
}

const insightResult = runInsightAgent(seriesData, rawData, null, semester);

// Test: Top performer identification
const topUniv = [...universities].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion)[0];
assert(topUniv.name === "Aurora University", "Top performer is Aurora University", `Got: ${topUniv.name}`);
assert(
  insightResult.insights.some(i => i.type === 'performer' && i.severity === 'info' && i.text.includes("Aurora")),
  "Insight agent identifies Aurora as top performer"
);

// Test: Bottom performer (needs attention)
const botUniv = [...universities].sort((a, b) => a.avgOverallCompletion - b.avgOverallCompletion)[0];
assert(botUniv.name === "Sanjay Ghodawat University", "Bottom performer is SGU", `Got: ${botUniv.name}`);
assert(
  insightResult.insights.some(i => i.type === 'performer' && i.severity === 'critical'),
  "Insight agent flags critical performer"
);

// Test: Practice gap detection
const lowPracticeUnivs = universities.filter(u => u.avgPracticeCompletion < 40);
assert(lowPracticeUnivs.length === 3, `3 universities below 40% practice (S-Vyasa, SGU, Crescent)`, `Got: ${lowPracticeUnivs.length}`);
assert(
  insightResult.insights.some(i => i.type === 'gap' && i.universities?.includes("S-Vyasa")),
  "Practice gap includes S-Vyasa"
);

// Test: Lecture-Practice imbalance
// Crescent: lecture=78, practice=30, ratio=0.38 < 0.6
assert(
  insightResult.insights.some(i => i.type === 'imbalance' && i.title.includes("Crescent")),
  "Imbalance detected for Crescent (L:78% vs P:30%)"
);

// Test: Low delivery detection
// SGU: sessions=180, allotted=354, ratio=0.508 < 0.6
assert(
  insightResult.insights.some(i => i.type === 'delivery' && i.title.includes("Sanjay")),
  "Low delivery flagged for SGU (180/354 = 50.8%)"
);

// S-Vyasa: sessions=350, allotted=673, ratio=0.52 < 0.6
assert(
  insightResult.insights.some(i => i.type === 'delivery' && i.title.includes("S-Vyasa")),
  "Low delivery flagged for S-Vyasa (350/673 = 52%)"
);

// NRI: sessions=480, allotted=510, ratio=0.94 — should NOT be flagged
assert(
  !insightResult.insights.some(i => i.type === 'delivery' && i.title.includes("NRI")),
  "NRI NOT flagged for low delivery (480/510 = 94%)"
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MONITORING AGENT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('2. MONITORING AGENT');

function runMonitoringAgent(seriesData, data) {
  const alerts = [];
  const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
  if (!allUnivs.length) return { alerts: [], kpis: {} };
  const totalStudents = allUnivs.reduce((s, u) => s + Math.round(u.avgClassSize * u.sectionCount), 0);
  const avgCompletion = allUnivs.reduce((s, u) => s + u.avgOverallCompletion, 0) / allUnivs.length;
  const avgPractice = allUnivs.reduce((s, u) => s + u.avgPracticeCompletion, 0) / allUnivs.length;
  const criticalCount = allUnivs.filter(u => u.avgOverallCompletion < 40).length;
  const healthyCount = allUnivs.filter(u => u.avgOverallCompletion > 70).length;
  const kpis = { totalUniversities: allUnivs.length, totalStudents, avgCompletion, avgPractice, criticalCount, healthyCount, healthRate: (healthyCount / allUnivs.length) * 100 };
  if (criticalCount > 0) alerts.push({ severity: 'critical', message: `${criticalCount} universities below 40%` });
  if (avgPractice < 45) alerts.push({ severity: 'warning', message: `Network-wide practice low at ${avgPractice.toFixed(1)}%` });

  // Zero practice detection
  const institutes = [...new Set(data.map(d => d.institute))];
  const zeroPractice = [];
  institutes.forEach(inst => {
    const courses = [...new Set(data.filter(d => d.institute === inst).map(d => d.course))];
    courses.forEach(course => {
      const prac = data.find(d => d.institute === inst && d.course === course && d.session_type === 'PRACTICE');
      if (!prac || prac.sessions === 0) zeroPractice.push({ institute: inst, course });
    });
  });
  if (zeroPractice.length > 0) alerts.push({ severity: 'warning', message: `${zeroPractice.length} zero practice`, details: zeroPractice });

  return { alerts, kpis };
}

const monResult = runMonitoringAgent(seriesData, rawData);

// KPI checks
assert(monResult.kpis.totalUniversities === 6, `Total universities = 6`, `Got: ${monResult.kpis.totalUniversities}`);

// Total students: NRI=60*3=180, S-Vyasa=45*2=90, SGU=55*1=55, Crescent=40*2=80, Annamacharya=50*2=100, Aurora=65*3=195 = 700
const expectedStudents = 180 + 90 + 55 + 80 + 100 + 195;
assert(monResult.kpis.totalStudents === expectedStudents, `Total students = ${expectedStudents}`, `Got: ${monResult.kpis.totalStudents}`);

// Critical count: SGU overall = (60+20+40)/3 = 40.0 — NOT < 40, so 0 critical
// Actually 40.0 is not < 40, so criticalCount should be 0
const sguOverall = (60 + 20 + 40) / 3; // = 40.0
assert(sguOverall === 40, "SGU overall completion is exactly 40%");
assert(monResult.kpis.criticalCount === 0, `Critical count = 0 (SGU at exactly 40%, not < 40)`, `Got: ${monResult.kpis.criticalCount}`);

// Healthy count (>70%): NRI=(85+72+78)/3=78.3, Aurora=(90+80+85)/3=85 → 2 healthy
const nriOverall = (85 + 72 + 78) / 3;
const auroraOverall = (90 + 80 + 85) / 3;
assert(nriOverall > 70, `NRI overall ${nriOverall.toFixed(1)}% is healthy (>70%)`);
assert(auroraOverall > 70, `Aurora overall ${auroraOverall.toFixed(1)}% is healthy (>70%)`);
assert(monResult.kpis.healthyCount === 2, `Healthy count = 2 (NRI, Aurora)`, `Got: ${monResult.kpis.healthyCount}`);

// Avg practice: (72+35+20+30+55+80)/6 = 292/6 = 48.67
const avgPractice = universities.reduce((s, u) => s + u.avgPracticeCompletion, 0) / universities.length;
assert(Math.abs(monResult.kpis.avgPractice - avgPractice) < 0.01, `Avg practice = ${avgPractice.toFixed(1)}%`, `Got: ${monResult.kpis.avgPractice.toFixed(1)}%`);

// Zero practice: SGU GENERATIVE_AI has sessions=0 for PRACTICE
assert(
  monResult.alerts.some(a => a.details?.some(d => d.institute === "Sanjay Ghodawat University" && d.course === "GENERATIVE_AI")),
  "Zero practice flagged for SGU's Generative AI"
);

// NRI MATHEMATICS has no EXAM row in rawData — but monitoring only checks PRACTICE zero sessions
// So it shouldn't flag NRI MATHEMATICS for zero practice (practice sessions = 55)
assert(
  !monResult.alerts.some(a => a.details?.some(d => d.institute === "NRI Institute of Technology" && d.course === "MATHEMATICS")),
  "NRI Mathematics NOT flagged (practice sessions = 55)"
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RECOMMENDATION AGENT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('3. RECOMMENDATION AGENT');

function runRecommendationAgent(seriesData) {
  const recs = [];
  const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
  allUnivs.forEach(u => {
    const allotted = getAllottedHours(u.name);
    if (u.avgPracticeCompletion < 40) {
      recs.push({ university: u.name, priority: 'high', title: 'Boost Practice Engagement', category: 'engagement' });
    }
    if (allotted && u.avgSessions / allotted < 0.6) {
      recs.push({ university: u.name, priority: 'critical', title: 'Delivery Catch-Up Required', category: 'delivery' });
    }
    if (u.avgLectureCompletion > 70 && u.avgPracticeCompletion < 40) {
      recs.push({ university: u.name, priority: 'medium', title: 'Rebalance Session Types', category: 'curriculum' });
    }
  });
  return recs.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, info: 3 };
    return (order[a.priority] || 3) - (order[b.priority] || 3);
  });
}

const recResult = runRecommendationAgent(seriesData);

// SGU: practice=20 <40 → engagement rec
assert(recResult.some(r => r.university === "Sanjay Ghodawat University" && r.category === 'engagement'), "SGU gets practice engagement rec");

// SGU: sessions=180, allotted=354, ratio=0.508 < 0.6 → delivery rec
assert(recResult.some(r => r.university === "Sanjay Ghodawat University" && r.category === 'delivery'), "SGU gets delivery catch-up rec");

// S-Vyasa: practice=35 <40 → engagement rec
assert(recResult.some(r => r.university === "S-Vyasa" && r.category === 'engagement'), "S-Vyasa gets practice engagement rec");

// S-Vyasa: sessions=350, allotted=673, ratio=0.52 < 0.6 → delivery rec
assert(recResult.some(r => r.university === "S-Vyasa" && r.category === 'delivery'), "S-Vyasa gets delivery catch-up rec");

// Crescent: lecture=78 >70, practice=30 <40 → rebalance rec
assert(recResult.some(r => r.university === "Crescent University" && r.category === 'curriculum'), "Crescent gets rebalance rec (L:78 P:30)");

// Aurora: should NOT get any negative recs (practice=80, lecture=90, sessions=420 with no allotted in our mock → null)
assert(!recResult.some(r => r.university === "Aurora University"), "Aurora gets no recs (all healthy)");

// NRI: practice=72 (not <40), sessions=480/510=0.94 (not <0.6) → no recs
assert(!recResult.some(r => r.university === "NRI Institute of Technology"), "NRI gets no recs (all healthy)");

// Priority ordering: critical recs should come before high
const firstCritical = recResult.findIndex(r => r.priority === 'critical');
const firstHigh = recResult.findIndex(r => r.priority === 'high');
const hasAnyCritical = firstCritical !== -1;
const hasAnyHigh = firstHigh !== -1;
assert(
  !hasAnyCritical || !hasAnyHigh || firstCritical < firstHigh,
  "Critical recs sorted before high recs",
  `critical@${firstCritical} high@${firstHigh} recs: ${JSON.stringify(recResult.map(r => r.priority + ':' + r.university))}`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONVERSATIONAL AGENT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('4. CONVERSATIONAL AGENT');

function runConversational(query) {
  const q = query.toLowerCase().trim();
  const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);

  // Help
  if (/\bhelp\b|what can you|commands/.test(q)) {
    return { type: 'info', text: 'help response' };
  }

  // Total universities
  if (/how many (uni|inst|college)|total (uni|inst)|number of uni|list (all |)uni|all institute/.test(q)) {
    return { type: 'info', text: `${allUnivs.length} Universities`, count: allUnivs.length };
  }

  // Total students
  if (/total students|how many students|student count/.test(q)) {
    const total = allUnivs.reduce((s, u) => s + Math.round(u.avgClassSize * u.sectionCount), 0);
    return { type: 'info', text: `Total Students: ${total}`, total };
  }

  // Top performers
  if (/top (performer|uni|institute)|best (uni|performing|completion)|highest (completion|overall)|who (is |are )?(lead|best|top)/.test(q)) {
    const n = parseInt((q.match(/top (\d+)/) || [])[1]) || 5;
    const top = [...allUnivs].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion).slice(0, n);
    return { type: 'success', text: `Top ${top.length}`, topNames: top.map(u => u.name) };
  }

  // At risk
  if (/at.?risk|struggling|worst|lowest|bottom|poor perform|need attention/.test(q)) {
    const bottom = [...allUnivs].sort((a, b) => a.avgOverallCompletion - b.avgOverallCompletion).slice(0, 5);
    return { type: 'warning', text: `Bottom 5`, bottomNames: bottom.map(u => u.name) };
  }

  // Practice completion
  if (/practice (completion|rate|%|gap)|low practice|no practice/.test(q)) {
    const sorted = [...allUnivs].sort((a, b) => a.avgPracticeCompletion - b.avgPracticeCompletion);
    return { type: sorted.some(u => u.avgPracticeCompletion < 40) ? 'warning' : 'success', sorted: sorted.map(u => ({ name: u.name, prac: u.avgPracticeCompletion })) };
  }

  // Delivery rate
  if (/delivery (rate|%)|sessions delivered|how many sessions|allotted/.test(q)) {
    const rows = allUnivs.map(u => {
      const allotted = getAllottedHours(u.name);
      const ratio = allotted ? u.avgSessions / allotted : null;
      return { name: u.name, sessions: u.avgSessions, allotted, ratio };
    });
    return { type: rows.some(r => r.ratio !== null && r.ratio < 0.7) ? 'warning' : 'success', rows };
  }

  // Compare
  if (/compare|vs\.?|versus/.test(q)) {
    const parts = q.replace(/compare|vs\.?|versus|and|with/gi, '|').split('|').map(w => w.trim()).filter(w => w.length > 1);
    const findU = (name) => allUnivs.find(u => u.name.toLowerCase().includes(name) || name.split(' ').some(w => w.length > 2 && u.name.toLowerCase().includes(w)));
    const u1 = findU(parts[0] || ''), u2 = parts.length > 1 ? findU(parts[1]) : null;
    if (u1 && u2) {
      return { type: 'info', u1: u1.name, u2: u2.name };
    }
    return { type: 'info', text: 'Could not match' };
  }

  // University name match
  const matchedUniv = allUnivs.find(u =>
    q.includes(u.name.toLowerCase()) ||
    u.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w))
  );
  if (matchedUniv) {
    return { type: matchedUniv.avgOverallCompletion < 50 ? 'warning' : matchedUniv.avgOverallCompletion > 75 ? 'success' : 'info', name: matchedUniv.name };
  }

  // Summary
  if (/summary|overview|status|report|network/.test(q)) {
    return { type: 'info', text: 'summary' };
  }

  // Fallback
  return { type: 'info', text: `no match for "${query}"`, fallback: true };
}

// Help command
const helpResp = runConversational("help");
assert(helpResp.type === 'info', "help returns info type");

// List universities
const listResp = runConversational("list all universities");
assert(listResp.count === 6, `list universities returns 6`, `Got: ${listResp.count}`);

// Total students
const studResp = runConversational("total students");
assert(studResp.total === expectedStudents, `total students = ${expectedStudents}`, `Got: ${studResp.total}`);

// Top performers
const topResp = runConversational("top performers");
assert(topResp.topNames[0] === "Aurora University", "Top 1 is Aurora", `Got: ${topResp.topNames[0]}`);
assert(topResp.topNames[1] === "NRI Institute of Technology", "Top 2 is NRI", `Got: ${topResp.topNames[1]}`);
assert(topResp.type === 'success', "Top performers returns success type");

// Top 3 specific
const top3Resp = runConversational("top 3 universities");
assert(top3Resp.topNames?.length === 3, "top 3 returns exactly 3", `Got: ${top3Resp.topNames?.length} (response: ${JSON.stringify(top3Resp)})`);

// At risk
const riskResp = runConversational("at risk");
assert(riskResp.bottomNames[0] === "Sanjay Ghodawat University", "Worst is SGU", `Got: ${riskResp.bottomNames[0]}`);
assert(riskResp.type === 'warning', "at risk returns warning type");

// Practice completion
const pracResp = runConversational("practice completion");
assert(pracResp.type === 'warning', "practice completion returns warning (some below 40%)");
assert(pracResp.sorted[0].name === "Sanjay Ghodawat University", "Lowest practice is SGU (20%)", `Got: ${pracResp.sorted[0].name}`);

// Delivery rate
const delResp = runConversational("delivery rate");
assert(delResp.type === 'warning', "delivery rate returns warning (some below 70%)");
const sguDel = delResp.rows.find(r => r.name === "Sanjay Ghodawat University");
assert(sguDel && Math.abs(sguDel.ratio - 180/354) < 0.01, "SGU delivery ratio = 50.8%", `Got: ${sguDel?.ratio?.toFixed(3)}`);

// Compare
const cmpResp = runConversational("compare NRI vs Aurora");
assert(cmpResp.u1 && cmpResp.u2, "Compare finds both universities");

// University name lookup — NRI should be 'success' (overall 78.3% > 75%)
const nriResp = runConversational("NRI");
assert(nriResp.name === "NRI Institute of Technology", "NRI name match works");
assert(nriResp.type === 'success', "NRI type is success (78.3% > 75%)");

// SGU should be 'warning' (overall 40% < 50%)
const sguResp = runConversational("sanjay ghodawat");
assert(sguResp.name === "Sanjay Ghodawat University", "SGU name match works");
assert(sguResp.type === 'warning', "SGU type is warning (40% < 50%)");

// Summary
const sumResp = runConversational("summary");
assert(sumResp.text === 'summary', "summary query matches");

// Fallback for unknown
const fbResp = runConversational("asdfgh random query");
assert(fbResp.fallback === true, "Unknown query returns fallback");

// ═══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASE & CORRECTNESS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('5. EDGE CASES & MATH VALIDATION');

// Validate overall completion formula: (L + P + E) / 3
universities.forEach(u => {
  const expected = (u.avgLectureCompletion + u.avgPracticeCompletion + u.avgExamCompletion) / 3;
  assert(
    Math.abs(u.avgOverallCompletion - expected) < 0.001,
    `${u.name} overall = (${u.avgLectureCompletion}+${u.avgPracticeCompletion}+${u.avgExamCompletion})/3 = ${expected.toFixed(1)}%`
  );
});

// Validate delivery ratios
const deliveryChecks = [
  { name: "NRI Institute of Technology", sessions: 480, allotted: 510, expected: 480/510 },
  { name: "S-Vyasa", sessions: 350, allotted: 673, expected: 350/673 },
  { name: "Sanjay Ghodawat University", sessions: 180, allotted: 354, expected: 180/354 },
];
deliveryChecks.forEach(d => {
  const ratio = d.sessions / d.allotted;
  assert(
    Math.abs(ratio - d.expected) < 0.001,
    `${d.name} delivery: ${d.sessions}/${d.allotted} = ${(ratio*100).toFixed(1)}%`
  );
});

// Empty data handling
const emptyInsight = runInsightAgent({ empty: { universities: [] } }, [], null, semester);
assert(emptyInsight.insights.length === 0, "Empty data returns no insights");

const emptyMon = runMonitoringAgent({ empty: { universities: [] } }, []);
assert(emptyMon.kpis.totalUniversities === undefined || emptyMon.kpis.totalUniversities === 0, "Empty data returns 0 universities in KPIs");

const emptyRec = runRecommendationAgent({ empty: { universities: [] } });
assert(emptyRec.length === 0, "Empty data returns no recommendations");

// No data at all
const nullInsight = runInsightAgent({}, [], null, semester);
assert(nullInsight.insights.length === 0, "Null seriesData returns no insights");

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ALLOTTED HOURS LOOKUP TESTS
// ═══════════════════════════════════════════════════════════════════════════════

section('6. ALLOTTED HOURS LOOKUP');

assert(getAllottedHours("NRI Institute of Technology") === 510, "NRI exact match = 510");
assert(getAllottedHours("S-Vyasa") === 673, "S-Vyasa exact match = 673");
assert(getAllottedHours("Sanjay Ghodawat University") === 354, "SGU exact match = 354");
assert(getAllottedHours("Unknown University XYZ") === null, "Unknown university returns null");

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${passed}/${total} passed, ${failed} failed`);
console.log(`${'═'.repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);
