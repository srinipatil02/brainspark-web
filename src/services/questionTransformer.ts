import {
  FirestoreQuestion,
  FirestoreMCQOption,
  FirestorePassage,
  Question,
  Passage
} from '@/types';

/**
 * Maps Firestore questionType to app-friendly type
 */
function mapQuestionType(firestoreType: string): Question['type'] {
  switch (firestoreType) {
    case 'MCQ':
      return 'multiple_choice';
    case 'SHORT_ANSWER':
      return 'short_answer';
    case 'EXTENDED_RESPONSE':
      return 'extended_response';
    default:
      return 'multiple_choice';
  }
}

/**
 * Maps numeric difficulty (1-5) to string difficulty
 */
function mapDifficulty(numericDifficulty: number): Question['difficulty'] {
  if (numericDifficulty <= 2) return 'easy';
  if (numericDifficulty <= 3) return 'medium';
  return 'hard';
}

/**
 * Builds a feedback map from MCQ options
 * Returns: { "A": "feedback text", "B": "feedback text", ... }
 */
function buildFeedbackMap(options?: FirestoreMCQOption[]): Record<string, string> | undefined {
  if (!options || options.length === 0) return undefined;

  const feedbackMap: Record<string, string> = {};
  options.forEach(opt => {
    if (opt.feedback) {
      feedbackMap[opt.id] = opt.feedback;
    }
  });

  return Object.keys(feedbackMap).length > 0 ? feedbackMap : undefined;
}

/**
 * Extracts topic from searchableTags
 */
function extractTopic(doc: FirestoreQuestion): string {
  const topicTag = doc.searchableTags?.find(t => t.category === 'topic');
  if (topicTag) return topicTag.value;

  // Fallback to curriculum substrand or strand
  if (doc.curriculum?.substrand) return doc.curriculum.substrand;
  if (doc.curriculum?.strand) return doc.curriculum.strand;

  return 'general';
}

/**
 * Extracts subject from curriculum or searchableTags
 */
function extractSubject(doc: FirestoreQuestion): string {
  // First try curriculum.subject
  if (doc.curriculum?.subject) return doc.curriculum.subject;

  // Then try searchableTags
  const subjectTag = doc.searchableTags?.find(t => t.category === 'subject');
  if (subjectTag) return subjectTag.value;

  // Fallback based on section
  if (doc.paperMetadata?.section) {
    const sectionMap: Record<string, string> = {
      'mathematics': 'mathematics',
      'reading': 'english',
      'thinkingSkills': 'reasoning',
      'writing': 'english'
    };
    return sectionMap[doc.paperMetadata.section] || 'general';
  }

  return 'general';
}

/**
 * Transforms a Firestore question document to app-friendly format
 */
export function transformFirestoreQuestion(doc: FirestoreQuestion): Question {
  // Find the correct option
  const correctOption = doc.mcqOptions?.find(opt => opt.isCorrect);

  // Extract hints content (just the text, sorted by level)
  const hints = doc.hints
    ?.sort((a, b) => a.level - b.level)
    .map(h => h.content);

  return {
    id: doc.questionId,
    text: doc.stem,
    type: mapQuestionType(doc.questionType),
    options: doc.mcqOptions?.map(opt => opt.text),
    optionIds: doc.mcqOptions?.map(opt => opt.id),
    correctAnswer: correctOption?.text,
    correctOptionId: correctOption?.id,
    explanation: doc.solution,
    hints,
    optionFeedback: buildFeedbackMap(doc.mcqOptions),
    subject: extractSubject(doc),
    topic: extractTopic(doc),
    difficulty: mapDifficulty(doc.difficulty),
    estimatedTimeSeconds: doc.estimatedTime,
    section: doc.paperMetadata?.section,
    passageId: doc.passageId,
  };
}

/**
 * Transforms a Firestore passage document to app-friendly format
 */
export function transformFirestorePassage(doc: FirestorePassage): Passage {
  return {
    id: doc.passageId,
    title: doc.title,
    content: doc.content,
    genre: doc.genre,
    wordCount: doc.wordCount,
    readingLevel: doc.readingLevel,
  };
}

/**
 * Transforms an array of Firestore questions
 */
export function transformFirestoreQuestions(docs: FirestoreQuestion[]): Question[] {
  return docs.map(transformFirestoreQuestion);
}

/**
 * Gets the option ID (A, B, C, D) from an answer text
 */
export function getOptionIdFromAnswer(question: Question, answerText: string): string | undefined {
  if (!question.options || !question.optionIds) return undefined;

  const index = question.options.indexOf(answerText);
  if (index === -1) return undefined;

  return question.optionIds[index];
}

/**
 * Gets the feedback for a selected option
 */
export function getFeedbackForOption(question: Question, optionId: string): string | undefined {
  return question.optionFeedback?.[optionId];
}

/**
 * Checks if the selected answer is correct
 */
export function isAnswerCorrect(question: Question, selectedOptionId: string): boolean {
  return selectedOptionId === question.correctOptionId;
}
