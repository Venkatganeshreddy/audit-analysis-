// Course to Subject mapping for NIAT 2025 Semester 2
// Maps canonical course names to their parent Subject

export const COURSE_TO_SUBJECT_MAPPING_SEM2 = {
  // Web Application Development - 2
  'Web Application Development 2': 'Web Application Development - 2',
  'Web Application Development - 2': 'Web Application Development - 2',
  'Js essentials': 'Web Application Development - 2',
  'JS Essentials': 'Web Application Development - 2',
  'JavaScript Essentials': 'Web Application Development - 2',
  'JavaScript Programming': 'Web Application Development - 2',
  'Introduction to React JS': 'Web Application Development - 2',
  'Introduction to React': 'Web Application Development - 2',
  'React JS': 'Web Application Development - 2',
  'React': 'Web Application Development - 2',
  'react js': 'Web Application Development - 2',
  'react': 'Web Application Development - 2',

  // Linear Algebra & Calculus
  'Linear Algebra & Calculus': 'Linear Algebra and Calculus',
  'Linear Algebra and Calculus': 'Linear Algebra and Calculus',
  'Linear Algebra': 'Linear Algebra and Calculus',
  'Calculus': 'Linear Algebra and Calculus',
  'Mathematics': 'Linear Algebra and Calculus',
  'Maths': 'Linear Algebra and Calculus',
  'mathematics': 'Linear Algebra and Calculus',
  'maths': 'Linear Algebra and Calculus',
  'math': 'Linear Algebra and Calculus',

  // Database Management Systems
  'Database Management Systems': 'Data Base Management System',
  'Data Base Management System': 'Data Base Management System',
  'Introduction to Database': 'Data Base Management System',
  'Introduction to Databases': 'Data Base Management System',
  'DBMS Fundamentals': 'Data Base Management System',
  'MongoDB': 'Data Base Management System',
  'SQL': 'Data Base Management System',
  'sql': 'Data Base Management System',
  'Dbms fundamentals': 'Data Base Management System',
  'mongodb': 'Data Base Management System',
  'Introduction to databases': 'Data Base Management System',

  // Numerical Aptitude
  'Numerical Aptitude': 'Numerical Ability',
  'Numerical Ability': 'Numerical Ability',
  'Quantitative Aptitude': 'Numerical Ability',
  'Logical Thinking': 'Numerical Ability',
  'numerical ability': 'Numerical Ability',
  'numerical aptitude': 'Numerical Ability',

  // English Advanced
  'English Advanced': 'Advanced English',
  'Advanced English': 'Advanced English',
  'Communicative English Foundation': 'Advanced English',
  'Communicative English Advanced': 'Advanced English',
  'Advanced Communicative English': 'Advanced English',
  'English Course': 'Advanced English',
  'Business English': 'Advanced English',
  'Comunicative English Advanced': 'Advanced English',
  'English B1 Level Learner Program': 'Advanced English',
  'B1 Level English': 'Advanced English',
  'English B1': 'Advanced English',
  'english course': 'Advanced English',
  'advanced english': 'Advanced English',
  'communicative english': 'Advanced English',

  // Data Structures
  'Data Structures': 'Data Structures',
  'Data Structures and Algorithm': 'Data Structures',
  'DSA': 'Data Structures',
  'DSA Foundation': 'Data Structures',
  'DSA Level 1': 'Data Structures',
  'NIAT-DSA': 'Data Structures',
  'Academy - DSA': 'Data Structures',
  'data structures': 'Data Structures',
  'niat-dsa': 'Data Structures',

  // Large Language Models
  'Large Language Models': 'Building LLM Applications',
  'LLM': 'Building LLM Applications',
  'Generative AI': 'Building LLM Applications',
  'Building REST API with Flask': 'Building LLM Applications',
  'Building LLM Applications': 'Building LLM Applications',
  'building llm applications': 'Building LLM Applications',

  // Indian Knowledge System
  'Indian Knowledge System': 'Indian Knowledge System',
  'IKS': 'Indian Knowledge System',
  'Indian Knowledge Systems': 'Indian Knowledge System',
  'indian knowledge system': 'Indian Knowledge System',

  // Engineering Drawing
  'Engineering Drawing': 'Engineering Drawing',
  'Engineering Drawing / Design Drafting': 'Engineering Drawing',
  'engineering drawing': 'Engineering Drawing',

  // Physics
  'Physics': 'Physics',
  'Engineering Physics': 'Physics',
  'physics': 'Physics',

  // Environmental Science
  'Environmental Science': 'Environmental Studies',
  'Environmental Studies': 'Environmental Studies',
  'environmental science': 'Environmental Studies',

  // Yoga
  'Yoga': 'Yoga',
  'yoga': 'Yoga',

  // Talent Development Program
  'Talent Development Program': 'Talent Development Program',
  'TDP': 'Talent Development Program',

  // Human Values & Ethics
  'Human Values & Ethics': 'Human Values & Ethics',
  'Human Values': 'Human Values & Ethics',
  'HVS': 'Human Values & Ethics',

  // Indian Constitution
  'Indian Constitution': 'Indian Constitution',

  // Language Elective
  'Language Elective': 'Language Elective',

  // Cloud Computing
  'Cloud Computing': 'Cloud Computing',

  // Chemistry
  'Chemistry': 'Chemistry',

  // Assessment
  'Assessment': 'Assessment',
};

// Keyword-based subject detection
const SUBJECT_KEYWORDS = {
  'Web Application Development - 2': ['web application', 'js essentials', 'javascript', 'react', 'js programming'],
  'Data Base Management System': ['database', 'dbms', 'sql', 'mongodb', 'mongo'],
  'Data Structures': ['data structures', 'dsa', 'data structure'],
  'Linear Algebra and Calculus': ['linear algebra', 'calculus', 'mathematics', 'maths', 'math'],
  'Building LLM Applications': ['llm', 'large language', 'generative ai', 'flask', 'building llm'],
  'Advanced English': ['english', 'communicative', 'b1 level'],
  'Numerical Ability': ['numerical', 'quantitative', 'logical thinking'],
  'Physics': ['physics'],
  'Chemistry': ['chemistry'],
  'Engineering Drawing': ['engineering drawing', 'design drafting'],
  'Indian Knowledge System': ['indian knowledge', 'iks'],
  'Environmental Studies': ['environmental', 'environtmenal'],
  'Human Values & Ethics': ['human values', 'hvs', 'ethics'],
  'Indian Constitution': ['constitution'],
  'Yoga': ['yoga'],
  'Talent Development Program': ['talent development', 'tdp'],
  'Language Elective': ['language elective'],
  'Cloud Computing': ['cloud computing'],
  'Assessment': ['assessment'],
};

// Subject display order (for consistent UI)
export const SUBJECT_DISPLAY_ORDER_SEM2 = [
  'Web Application Development - 2',
  'Data Structures',
  'Data Base Management System',
  'Linear Algebra and Calculus',
  'Building LLM Applications',
  'Advanced English',
  'Numerical Ability',
  'Physics',
  'Chemistry',
  'Engineering Drawing',
  'Indian Knowledge System',
  'Environmental Studies',
  'Human Values & Ethics',
  'Indian Constitution',
  'Yoga',
  'Talent Development Program',
  'Language Elective',
  'Cloud Computing',
  'Assessment',
];

// Normalize text for matching
const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Helper function to get subject from course name
export function getSubjectFromCourse(courseName, semester = 'Semester 2') {
  if (semester !== 'Semester 2') return courseName;

  const normalized = String(courseName || '').trim();
  if (!normalized) return normalized;

  // Direct lookup
  if (COURSE_TO_SUBJECT_MAPPING_SEM2[normalized]) {
    return COURSE_TO_SUBJECT_MAPPING_SEM2[normalized];
  }

  // Case-insensitive lookup
  const lowerNormalized = normalized.toLowerCase();
  for (const [course, subject] of Object.entries(COURSE_TO_SUBJECT_MAPPING_SEM2)) {
    if (course.toLowerCase() === lowerNormalized) {
      return subject;
    }
  }

  // Normalized lookup (removes special chars)
  const normalizedKey = normalizeText(normalized);
  for (const [course, subject] of Object.entries(COURSE_TO_SUBJECT_MAPPING_SEM2)) {
    if (normalizeText(course) === normalizedKey) {
      return subject;
    }
  }

  // Keyword-based matching
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerNormalized.includes(keyword.toLowerCase())) {
        return subject;
      }
    }
  }

  // Partial match on original
  for (const [course, subject] of Object.entries(COURSE_TO_SUBJECT_MAPPING_SEM2)) {
    const lowerCourse = course.toLowerCase();
    if (lowerNormalized.includes(lowerCourse) || lowerCourse.includes(lowerNormalized)) {
      return subject;
    }
  }

  // Partial match on normalized
  for (const [course, subject] of Object.entries(COURSE_TO_SUBJECT_MAPPING_SEM2)) {
    const normCourse = normalizeText(course);
    if (normalizedKey.includes(normCourse) || normCourse.includes(normalizedKey)) {
      return subject;
    }
  }

  // Return original if no mapping found
  return normalized;
}

// Helper to get all unique subjects for Semester 2
export function getAllSubjectsSem2() {
  return [...new Set(Object.values(COURSE_TO_SUBJECT_MAPPING_SEM2))];
}
