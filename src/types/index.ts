// ============================================
// FIRESTORE TYPES (match actual database schema)
// ============================================

// Firestore MCQ Option structure
export interface FirestoreMCQOption {
  id: string;           // "A", "B", "C", "D"
  text: string;         // The answer text
  isCorrect: boolean;   // Whether this is correct
  feedback?: string;    // Feedback for this option
}

// Firestore Hint structure
export interface FirestoreHint {
  level: number;                // 1, 2, 3
  content: string;              // Hint text
  revealsCriticalInfo: boolean; // Whether it gives away answer
}

// Firestore Curriculum structure
export interface FirestoreCurriculum {
  system: string;       // "NSW Mathematics K-10 Syllabus"
  codes: string[];      // ["MA3-5NA"]
  year: number;         // 6
  subject: string;      // "mathematics"
  strand: string;       // "Number and Algebra"
  substrand?: string;
}

// Firestore Skills structure
export interface FirestoreSkills {
  primarySkill: string;
  secondarySkills: string[];
  competencyLevel: string;
  cognitiveLevel: string;
  prerequisites: string[];
}

// Firestore Searchable Tag
export interface FirestoreSearchableTag {
  category: string;     // "topic", "skill", "year", "assessment"
  value: string;        // "percentages", "nsw-selective"
  weight: number;       // 1.0
}

// Firestore AI Metadata
export interface FirestoreAIMetadata {
  generatedBy: string;
  generatedAt: string;
  validationStatus: string;
  validatedBy?: string;
  validatedAt?: string;
}

// ACTUAL Firestore Question structure
export interface FirestoreQuestion {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  stem: string;
  mcqOptions?: FirestoreMCQOption[];
  solution?: string;
  hints?: FirestoreHint[];
  curriculum?: FirestoreCurriculum;
  skills?: FirestoreSkills;
  searchableTags?: FirestoreSearchableTag[];
  difficulty: number;   // 1-5
  estimatedTime?: number;
  qcs?: number;         // Question Complexity Score
  passageId?: string;   // For reading comprehension
  paperMetadata?: {
    paperId?: string;
    title?: string;
    section: string;    // "mathematics", "reading", "thinkingSkills", "writing"
  };
  aiMetadata?: FirestoreAIMetadata;
  version?: number;
  status: string;       // "published", "draft"
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

// Firestore Passage structure (for reading comprehension)
export interface FirestorePassage {
  passageId: string;
  title: string;
  genre: string;
  wordCount: number;
  readingLevel: string;
  content: string;
  source?: string;
  tags?: string[];
  curriculum?: FirestoreCurriculum;
}

// ============================================
// APP TYPES (transformed for UI consumption)
// ============================================

// App-friendly Question (transformed from Firestore)
export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'extended_response' | 'writing';
  options?: string[];
  optionIds?: string[];           // ["A", "B", "C", "D"]
  correctAnswer?: string;
  correctOptionId?: string;       // "A", "B", "C", "D"
  explanation?: string;
  hints?: string[];
  optionFeedback?: Record<string, string>;  // {A: "feedback", B: "feedback"}
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeSeconds?: number;
  section?: string;               // For NSW Selective
  passageId?: string;             // For reading comprehension
}

// App-friendly Passage
export interface Passage {
  id: string;
  title: string;
  content: string;
  genre: string;
  wordCount: number;
  readingLevel: string;
}

// User types
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  createdAt: Date;
}

// Attempt types
export interface Attempt {
  id: string;
  questionId: string;
  userId: string;
  answer: string;
  selectedOptionId?: string;      // "A", "B", "C", "D"
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
  timeSpentSeconds?: number;
  hintsUsed?: number;
  createdAt: Date;
}

// AI Grading result
export interface GradingResult {
  score: number;
  feedback: string;
  suggestions?: string[];
  isCorrect: boolean;
}

// Question Set for organizing practice
export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  section: string;
  questionCount: number;
  timeLimitSeconds?: number;
  difficulty: string;
}
