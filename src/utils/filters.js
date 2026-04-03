export const applyFilters = (data, filters, type = 'semester') => {
  if (!data || !data.length) return data;
  let filtered = [...data];
  const hasBatchCol = filtered.some(d => d.batch && d.batch.trim() !== '');
  const hasSemesterCol = filtered.some(d => d.semester && d.semester.trim() !== '');
  const hasDateCol = filtered.some(d => d.report_date && d.report_date.trim() !== '');
  if (filters.batch && hasBatchCol) filtered = filtered.filter(d => d.batch === filters.batch);
  if (filters.semester && hasSemesterCol) filtered = filtered.filter(d => d.semester === filters.semester);
  if (hasDateCol && (filters.startDate || filters.endDate)) {
    filtered = filtered.filter(d => {
      const recordDate = d.report_date;
      if (!recordDate) return true;
      if (filters.startDate && recordDate < filters.startDate) return false;
      if (filters.endDate && recordDate > filters.endDate) return false;
      return true;
    });
  }
  return filtered;
};

export const extractFilterOptions = (semesterData, assessmentData) => {
  const allBatches = new Set(), allSemesters = new Set(), allDates = [];
  const hasBatchInSem = semesterData?.some(d => d.batch && d.batch.trim() !== '');
  const hasSemInSem = semesterData?.some(d => d.semester && d.semester.trim() !== '');
  const hasDateInSem = semesterData?.some(d => d.report_date && d.report_date.trim() !== '');
  const hasBatchInAss = assessmentData?.some(d => d.batch && d.batch.trim() !== '');
  const hasSemInAss = assessmentData?.some(d => d.semester && d.semester.trim() !== '');
  const hasDateInAss = assessmentData?.some(d => d.report_date && d.report_date.trim() !== '');
  if (hasBatchInSem) semesterData.forEach(d => { if (d.batch) allBatches.add(d.batch); });
  if (hasBatchInAss && assessmentData) assessmentData.forEach(d => { if (d.batch) allBatches.add(d.batch); });
  if (hasSemInSem) semesterData.forEach(d => { if (d.semester) allSemesters.add(d.semester); });
  if (hasSemInAss && assessmentData) assessmentData.forEach(d => { if (d.semester) allSemesters.add(d.semester); });
  if (hasDateInSem) semesterData.forEach(d => { if (d.report_date) allDates.push(d.report_date); });
  if (hasDateInAss && assessmentData) assessmentData.forEach(d => { if (d.report_date) allDates.push(d.report_date); });
  const sortedDates = allDates.sort();
  return {
    batches: [...allBatches].sort(),
    semesters: [...allSemesters].sort((a, b) => { const numA = parseInt(a.replace(/\D/g, '')) || 0; const numB = parseInt(b.replace(/\D/g, '')) || 0; return numA - numB; }),
    minDate: sortedDates[0] || '', maxDate: sortedDates[sortedDates.length - 1] || '',
    hasDataColumns: { batch: hasBatchInSem || hasBatchInAss, semester: hasSemInSem || hasSemInAss, date: hasDateInSem || hasDateInAss },
  };
};
