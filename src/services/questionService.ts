import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question, QuestionSet, FirestoreQuestion } from '@/types';
import { transformFirestoreQuestion, transformFirestoreQuestions } from './questionTransformer';

/**
 * Fetch NSW Selective questions by section
 * @param section - 'reading' | 'mathematics' | 'thinkingSkills' | 'writing'
 * @param maxQuestions - Maximum number of questions to fetch
 */
export async function getNSWSelectiveQuestions(
  section: 'reading' | 'mathematics' | 'thinkingSkills' | 'writing',
  maxQuestions: number = 10
): Promise<Question[]> {
  try {
    // Query using actual Firestore structure
    const q = query(
      collection(db, 'questions'),
      where('paperMetadata.section', '==', section),
      where('status', '==', 'published'),
      limit(maxQuestions)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No questions found for section: ${section}`);
      return [];
    }

    const firestoreDocs = snapshot.docs.map(doc => doc.data() as FirestoreQuestion);
    return transformFirestoreQuestions(firestoreDocs);
  } catch (error) {
    console.error('Error fetching NSW Selective questions:', error);
    return [];
  }
}

/**
 * Fetch questions by subject and optional topic
 * Used for Year 8 Curriculum practice
 */
export async function getQuestions(
  subject: string,
  topic?: string,
  difficulty?: number,
  maxQuestions: number = 10
): Promise<Question[]> {
  try {
    // Query using curriculum.subject field
    let q = query(
      collection(db, 'questions'),
      where('curriculum.subject', '==', subject.toLowerCase()),
      where('status', '==', 'published'),
      limit(maxQuestions)
    );

    // Note: Firestore doesn't support multiple inequality filters
    // For topic filtering, we'll filter client-side if needed

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No questions found for subject: ${subject}`);
      return [];
    }

    let firestoreDocs = snapshot.docs.map(doc => doc.data() as FirestoreQuestion);

    // Client-side filtering for topic if specified
    if (topic) {
      firestoreDocs = firestoreDocs.filter(doc => {
        const topicTag = doc.searchableTags?.find(t => t.category === 'topic');
        return topicTag?.value?.toLowerCase() === topic.toLowerCase();
      });
    }

    // Client-side filtering for difficulty if specified
    if (difficulty !== undefined) {
      firestoreDocs = firestoreDocs.filter(doc => doc.difficulty === difficulty);
    }

    return transformFirestoreQuestions(firestoreDocs);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

/**
 * Fetch a single question by ID
 */
export async function getQuestion(questionId: string): Promise<Question | null> {
  try {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return transformFirestoreQuestion(docSnap.data() as FirestoreQuestion);
    }
    return null;
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
}

/**
 * Fetch question sets for practice organization
 */
export async function getQuestionSets(section?: string): Promise<QuestionSet[]> {
  try {
    let q = query(collection(db, 'sets'), orderBy('title'));

    if (section) {
      q = query(q, where('section', '==', section));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuestionSet));
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return [];
  }
}

/**
 * Get available subjects from questions collection
 * Note: This scans the collection - consider caching in production
 */
export async function getSubjects(): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'questions'),
      where('status', '==', 'published'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const subjects = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data() as FirestoreQuestion;
      if (data.curriculum?.subject) {
        subjects.add(data.curriculum.subject);
      }
    });

    return Array.from(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return ['mathematics', 'science']; // Fallback defaults
  }
}

/**
 * Get topics for a specific subject
 * Note: This scans the collection - consider caching in production
 */
export async function getTopics(subject: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'questions'),
      where('curriculum.subject', '==', subject.toLowerCase()),
      where('status', '==', 'published'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const topics = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data() as FirestoreQuestion;
      // Extract topic from searchableTags
      const topicTag = data.searchableTags?.find(t => t.category === 'topic');
      if (topicTag?.value) {
        topics.add(topicTag.value);
      }
      // Also check curriculum strand/substrand
      if (data.curriculum?.substrand) {
        topics.add(data.curriculum.substrand);
      }
    });

    return Array.from(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
}

/**
 * Fetch questions by searchable tags
 * Useful for more complex filtering
 */
export async function getQuestionsByTags(
  tags: { category: string; value: string }[],
  maxQuestions: number = 10
): Promise<Question[]> {
  try {
    // Firestore array-contains only works with exact object match
    // For now, we'll use a simpler approach with status filter
    const q = query(
      collection(db, 'questions'),
      where('status', '==', 'published'),
      limit(maxQuestions * 2) // Fetch more for client-side filtering
    );

    const snapshot = await getDocs(q);

    // Client-side filter by tags
    const firestoreDocs = snapshot.docs
      .map(doc => doc.data() as FirestoreQuestion)
      .filter(doc => {
        if (!doc.searchableTags) return false;
        return tags.every(tag =>
          doc.searchableTags?.some(
            st => st.category === tag.category && st.value === tag.value
          )
        );
      })
      .slice(0, maxQuestions);

    return transformFirestoreQuestions(firestoreDocs);
  } catch (error) {
    console.error('Error fetching questions by tags:', error);
    return [];
  }
}
