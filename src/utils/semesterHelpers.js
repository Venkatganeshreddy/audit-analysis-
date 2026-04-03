import {
  COURSE_MAPPING_BY_SEMESTER,
  ALLOTTED_HOURS_BY_SEMESTER,
  SEMESTER_DATES_BY_SEMESTER,
  SERIES_RANGES,
} from '../constants';

export const getCourseMapping = (semester) =>
  COURSE_MAPPING_BY_SEMESTER[semester] || COURSE_MAPPING_BY_SEMESTER['Semester 1'];

export const getAllottedHours = (name, semester) => {
  const semHours = ALLOTTED_HOURS_BY_SEMESTER[semester] || ALLOTTED_HOURS_BY_SEMESTER['Semester 1'];
  if (semHours[name]) return semHours[name];
  for (const k of Object.keys(semHours)) {
    if (name.toLowerCase().includes(k.toLowerCase().split(' ')[0])) return semHours[k];
  }
  return null;
};

export const getSemesterDatesForInstitute = (name, sem) => {
  const semDates = SEMESTER_DATES_BY_SEMESTER[sem] || SEMESTER_DATES_BY_SEMESTER['Semester 1'];
  if (semDates[name]) return semDates[name];
  for (const k of Object.keys(semDates)) {
    if (name.toLowerCase().includes(k.toLowerCase().split(' ')[0])) return semDates[k];
  }
  return null;
};

export const getSeriesForValue = (v) =>
  SERIES_RANGES.find(s => v >= s.min && v < s.max) || SERIES_RANGES[5];

export const getSeriesForAllottedHours = (name, semester) => {
  const hours = getAllottedHours(name, semester);
  if (!hours) return null;
  return SERIES_RANGES.find(s => hours >= s.min && hours < s.max) || SERIES_RANGES[5];
};

export const r2 = (v) => Math.round(v * 100) / 100;
