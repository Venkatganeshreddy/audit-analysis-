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

const COURSE_ALIAS_GROUPS_BY_SEMESTER = {
  'Semester 1': {
    'Introduction to Generative AI': ['generative ai', 'introduction to generative ai'],
    'Mathematics for Computer Science': ['mathematics', 'mathematics for computer science'],
    'Web Application Development I': [
      'build your own static website',
      'build your own responsive website',
      'modern responsive web design',
      'responsive web design using flexbox',
      'html & css',
      'web application development i',
    ],
    'Communication English Foundation': [
      'communicative english foundation',
      'communication english foundation',
      'english foundation',
    ],
    'Computer Programming': [
      'programming foundations',
      'programing foundation',
      'python programming',
      'problem solving with python programming',
      'computer programming',
      'introduction to niat',
      'niat practice page',
      'logical thinking',
      'oops',
      'more python problem solving',
    ],
    'Quantitative Aptitude': ['quantitative aptitude', 'numerical aptitude'],
  },
  'Semester 2': {
    'Web Application Development 2': [
      'web application development 2',
      'build your own dynamic web application',
      'js essentials',
      'javascript essentials',
      'js programming',
      'introduction to react js',
      'react js',
      'node js',
    ],
    'Database Management Systems': [
      'database management systems',
      'introduction to database',
      'introduction to databases',
    ],
    'Data Structures': [
      'data structures',
      'data structures and algorithm',
      'dsa',
      'dsa foundation',
      'dsa level 1',
      'dsa extra coding questions',
      'dsa - beginner',
      'niat - dsa',
      'academy - dsa',
      'phase 1 : data structures and algorithms',
      'foundations of data structures and algorithms',
    ],
    'Numerical Aptitude': ['numerical aptitude', 'quantitative aptitude', 'logical thinking'],
    'English Advanced': ['english advanced', 'communicative english foundation', 'business english'],
    'Large Language Models': ['large language models', 'llm', 'generative ai'],
    'Physics': ['physics'],
    'Chemistry': ['chemistry'],
    'Yoga': ['yoga'],
    'Talent Development Program': ['talent development program', 'tdp'],
    'Human Values & Ethics': ['human values', 'human values & ethics', 'hvs'],
    'Assessment': ['assessment'],
    'Business English': ['business english'],
    'Indian Knowledge System': ['indian knowledge system', 'iks'],
    'Linear Algebra & Calculus': ['linear algebra', 'linear algebra & calculus', 'calculus'],
    'Environmental Science': ['environmental science'],
    'Indian Constitution': ['indian constitution'],
    'Language Elective': ['language elective'],
    'Engineering Drawing': ['engineering drawing'],
    'Cloud Computing': ['cloud computing'],
  },
};

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const normalizeCourseName = (courseName, semester) => {
  const raw = String(courseName || '').trim();
  if (!raw) return raw;

  const courseMap = getCourseMapping(semester);
  if (courseMap[raw]) return courseMap[raw];

  const normalizedRaw = normalizeText(raw);
  const aliasGroups = COURSE_ALIAS_GROUPS_BY_SEMESTER[semester] || {};

  for (const [canonicalName, aliases] of Object.entries(aliasGroups)) {
    if (aliases.some((alias) => normalizedRaw === normalizeText(alias) || normalizedRaw.includes(normalizeText(alias)))) {
      return canonicalName;
    }
  }

  return raw;
};
