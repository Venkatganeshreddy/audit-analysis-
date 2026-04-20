// Course to Subject mapping for NIAT 2025 Semester 2
// Maps canonical course names to their parent Subject

export const COURSE_TO_SUBJECT_MAPPING_SEM2 = {
  // Web Application Development - 2
  'Web Application Development 2': 'Web Application Development - 2',
  'Js essentials': 'Web Application Development - 2',
  'JavaScript Essentials': 'Web Application Development - 2',
  'JavaScript Programming': 'Web Application Development - 2',
  'Introduction to React JS': 'Web Application Development - 2',
  'React JS': 'Web Application Development - 2',
  'Node JS': 'Web Application Development - 2',

  // Linear Algebra & Calculus
  'Linear Algebra & Calculus': 'Linear Algebra and Calculus',
  'Linear Algebra': 'Linear Algebra and Calculus',
  'Calculus': 'Linear Algebra and Calculus',
  'Mathematics': 'Linear Algebra and Calculus',

  // Database Management Systems
  'Database Management Systems': 'Data Base Management System',
  'Introduction to Database': 'Data Base Management System',
  'Introduction to Databases': 'Data Base Management System',
  'DBMS Fundamentals': 'Data Base Management System',
  'MongoDB': 'Data Base Management System',

  // Numerical Aptitude
  'Numerical Aptitude': 'Numerical Ability',
  'Quantitative Aptitude': 'Numerical Ability',
  'Logical Thinking': 'Numerical Ability',

  // English Advanced
  'English Advanced': 'Advanced English',
  'Communicative English Foundation': 'Advanced English',
  'Business English': 'Advanced English',
  'Comunicative English Advanced': 'Advanced English',
  'English B1 Level Learner Program': 'Advanced English',

  // Data Structures
  'Data Structures': 'Data Structures',
  'Data Structures and Algorithm': 'Data Structures',
  'DSA': 'Data Structures',
  'DSA Foundation': 'Data Structures',
  'DSA Level 1': 'Data Structures',
  'NIAT-DSA': 'Data Structures',
  'Academy - DSA': 'Data Structures',

  // Large Language Models
  'Large Language Models': 'Building LLM Applications',
  'LLM': 'Building LLM Applications',
  'Generative AI': 'Building LLM Applications',
  'Building REST API with Flask': 'Building LLM Applications',
  'Building LLM Applications': 'Building LLM Applications',

  // Indian Knowledge System
  'Indian Knowledge System': 'Indian Knowledge System',
  'IKS': 'Indian Knowledge System',

  // Engineering Drawing
  'Engineering Drawing': 'Engineering Drawing',
  'Engineering Drawing / Design Drafting': 'Engineering Drawing',

  // Physics
  'Physics': 'Physics',
  'Engineering Physics': 'Physics',

  // Environmental Science
  'Environmental Science': 'Environmental Studies',
  'Environmental Studies': 'Environmental Studies',

  // Yoga
  'Yoga': 'Yoga',

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

  // Partial match
  for (const [course, subject] of Object.entries(COURSE_TO_SUBJECT_MAPPING_SEM2)) {
    if (lowerNormalized.includes(course.toLowerCase()) ||
        course.toLowerCase().includes(lowerNormalized)) {
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
