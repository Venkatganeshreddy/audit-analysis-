import { getCourseMapping, getAllottedHours } from '../utils';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const MODEL = 'google/gemini-2.0-flash-001';

function buildDataContext(seriesData, rawData, assessmentData, recommendations, monitoring, semester) {
  const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
  if (!allUnivs.length) return 'No university data loaded yet.';

  const courseMap = getCourseMapping(semester);
  const kpis = monitoring?.kpis || {};

  let ctx = `SEMESTER: ${semester || 'Semester 1'}\n`;
  ctx += `TOTAL UNIVERSITIES: ${allUnivs.length}\n`;
  ctx += `TOTAL STUDENTS: ~${(kpis.totalStudents || allUnivs.reduce((s, u) => s + Math.round(u.avgClassSize * u.sectionCount), 0)).toLocaleString()}\n`;
  ctx += `NETWORK AVG COMPLETION: ${(kpis.avgCompletion || 0).toFixed(1)}%\n`;
  ctx += `HEALTHY (>70%): ${kpis.healthyCount || 0} | CRITICAL (<40%): ${kpis.criticalCount || 0}\n\n`;

  ctx += '--- UNIVERSITY DATA ---\n';
  const sorted = [...allUnivs].sort((a, b) => b.avgOverallCompletion - a.avgOverallCompletion);
  sorted.forEach((u, i) => {
    const allotted = getAllottedHours(u.name, semester);
    const deliveryPct = allotted ? ((u.avgSessions / allotted) * 100).toFixed(0) + '%' : 'N/A';
    ctx += `${i + 1}. ${u.name}\n`;
    ctx += `   Sections: ${u.sectionCount} | Class Size: ~${u.avgClassSize.toFixed(0)} | Sessions: ${u.avgSessions.toFixed(0)}`;
    if (allotted) ctx += ` / ${allotted} allotted (${deliveryPct} delivery)`;
    ctx += '\n';
    ctx += `   Lecture: ${u.avgLectureCompletion.toFixed(1)}% | Practice: ${u.avgPracticeCompletion.toFixed(1)}% | Exam: ${u.avgExamCompletion.toFixed(1)}% | Overall: ${u.avgOverallCompletion.toFixed(1)}%\n`;
    ctx += `   Workload: Avg ${u.avgWorkload.toFixed(1)}h | P80 ${u.avgP80Workload.toFixed(1)}h\n`;
    if (u.avgAssessmentScore !== null) {
      ctx += `   Assessment Score: ${(u.avgAssessmentScore * 100).toFixed(1)}% | Participation: ${u.avgParticipation?.toFixed(0) || 'N/A'}\n`;
    }
    ctx += '\n';
  });

  if (rawData && rawData.length > 0) {
    ctx += '--- COURSE-LEVEL BREAKDOWN ---\n';
    const institutes = [...new Set(rawData.map(d => d.institute))];
    institutes.forEach(inst => {
      const courses = [...new Set(rawData.filter(d => d.institute === inst).map(d => d.course))];
      ctx += `${inst}:\n`;
      courses.forEach(c => {
        const rows = rawData.filter(d => d.institute === inst && d.course === c);
        const lec = rows.find(d => d.session_type === 'LECTURE');
        const prac = rows.find(d => d.session_type === 'PRACTICE');
        const exam = rows.find(d => d.session_type === 'EXAM');
        const name = courseMap[c] || c;
        ctx += `  ${name}: L=${lec?.completion?.toFixed(0) || '-'}% (${lec?.sessions || 0} sess) | P=${prac?.completion?.toFixed(0) || '-'}% (${prac?.sessions || 0} sess) | E=${exam?.completion?.toFixed(0) || '-'}% (${exam?.sessions || 0} sess)\n`;
      });
      ctx += '\n';
    });
  }

  if (monitoring?.alerts?.length) {
    ctx += '--- ACTIVE ALERTS ---\n';
    monitoring.alerts.forEach(a => {
      ctx += `[${a.severity.toUpperCase()}] ${a.message}\n`;
    });
    ctx += '\n';
  }

  if (recommendations?.length) {
    ctx += '--- RECOMMENDATIONS ---\n';
    recommendations.slice(0, 8).forEach(r => {
      ctx += `[${r.priority.toUpperCase()}] ${r.title} - ${r.university}: ${r.action}\n`;
    });
    ctx += '\n';
  }

  return ctx;
}

const SYSTEM_PROMPT = `You are the NIAT Intelligence Agent, an analytics assistant for the NIAT (National Institute of Applied Technology) university network dashboard.

Your role:
- Analyze university performance data including lecture completion, practice completion, exam completion, delivery rates, workload, and assessment scores.
- Answer questions about specific universities, courses, comparisons, trends, and provide actionable insights.
- Identify at-risk universities, top performers, practice gaps, delivery shortfalls, and correlations.

Rules:
- ALWAYS respond in plain text only. Never use markdown formatting like **, ##, *, bullet symbols, or any markdown syntax.
- Use simple dashes (-) for lists and plain numbers for rankings.
- Keep responses concise and data-driven. Quote specific numbers from the data.
- If asked about something not in the data, say so clearly.
- When comparing, show side-by-side numbers.
- Flag critical issues (completion <40%, delivery <60%, zero practice sessions) proactively when relevant.
- Provide actionable suggestions when asked for recommendations.
- overall completion is the average of lecture, practice, and exam completion percentages.`;

const ConversationalAgent = {
  async process(query, seriesData, rawData, assessmentData, recommendations, monitoring, semester) {
    if (!seriesData) return { text: 'Please upload data first to start analysis.', type: 'info' };

    const dataContext = buildDataContext(seriesData, rawData, assessmentData, recommendations, monitoring, semester);

    if (!API_KEY) {
      return { text: 'OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your .env file.', type: 'warning' };
    }

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NIAT Analytics Dashboard',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Here is the current university network data:\n\n${dataContext}` },
            { role: 'user', content: query },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || response.statusText || 'Unknown error';
        return { text: `API error (${response.status}): ${errMsg}`, type: 'warning' };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (!text) {
        return { text: 'No response received from the model. Please try again.', type: 'warning' };
      }

      const type = detectResponseType(text, query);
      return { text, type };

    } catch (err) {
      return { text: `Connection error: ${err.message}. Check your network and API key.`, type: 'warning' };
    }
  },
};

function detectResponseType(text, query) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (/at.?risk|critical|below 40|needs? (attention|help)|struggling|worst|poor/.test(t)) return 'warning';
  if (/top performer|excellent|healthy|strong|above 70|leading/.test(t) && /top|best|performer|leader/.test(q)) return 'success';
  return 'info';
}

export default ConversationalAgent;
