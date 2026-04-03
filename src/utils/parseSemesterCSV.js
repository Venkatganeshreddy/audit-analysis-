export const parseSemesterCSV = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const findCol = (...patterns) => { for (const p of patterns) { const i = headers.findIndex(h => h.includes(p.toLowerCase())); if (i !== -1) return i; } return -1; };
  const cols = {
    course: findCol('course'), institute: findCol('institute_name', 'institute'), section: findCol('section_na', 'section_name', 'section'),
    sessionType: findCol('session_type'),
    sessions: findCol('distinct sessions delivered', 'distinct sessions', 'sessions delivered', 'sessions'),
    students: findCol('total_students', 'students'),
    completion: findCol('average of % completed', 'average of %', '% completed', 'completed'),
    avgTime: findCol('sum of avg_time_spent_to_complete', 'avg_time_spent_to_complete', 'avg_time_spent', 'avg_time'),
    p80Time: findCol('sum of p80_time_to_completed', 'p80_time_to_completed', 'p80_time'),
    batch: findCol('batch'), semester: findCol('semester'), reportDate: findCol('report_date', 'date'),
  };
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = []; let curr = '', inQ = false;
    for (const c of lines[i]) { if (c === '"') inQ = !inQ; else if (c === ',' && !inQ) { vals.push(curr.trim()); curr = ''; } else curr += c; }
    vals.push(curr.trim());
    const get = (idx) => idx >= 0 && idx < vals.length ? vals[idx].replace(/"/g, '').trim() : '';
    const getNum = (idx) => parseFloat(get(idx).replace('%', '')) || 0;
    const course = get(cols.course), institute = get(cols.institute), sessionType = get(cols.sessionType).toUpperCase();
    if (!course || !institute || !sessionType) continue;
    result.push({ course, institute, section: get(cols.section), session_type: sessionType, sessions: getNum(cols.sessions), students: getNum(cols.students), completion: getNum(cols.completion), avg_time: getNum(cols.avgTime), p80_time: getNum(cols.p80Time), batch: get(cols.batch), semester: get(cols.semester), report_date: get(cols.reportDate) });
  }
  return result;
};
