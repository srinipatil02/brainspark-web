import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Attempt } from '@/types';

export interface UserProgress {
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  questionsToday: number;
  streak: number;
  lastActivityDate: Date | null;
}

export interface SubjectProgress {
  subject: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  topics: TopicProgress[];
}

export interface TopicProgress {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
}

// Save an attempt
export async function saveAttempt(attempt: Omit<Attempt, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'attempts'), {
      ...attempt,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving attempt:', error);
    throw error;
  }
}

// Get user's overall progress
export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const attempts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Attempt[];

    const totalQuestions = attempts.length;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;

    // Calculate today's questions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const questionsToday = attempts.filter(a => {
      const attemptDate = a.createdAt instanceof Date ? a.createdAt : new Date();
      return attemptDate >= today;
    }).length;

    // Find last activity
    let lastActivityDate: Date | null = null;
    if (attempts.length > 0) {
      const sortedAttempts = attempts.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      const lastAttempt = sortedAttempts[0];
      lastActivityDate = lastAttempt.createdAt instanceof Date ? lastAttempt.createdAt : null;
    }

    return {
      totalQuestions,
      correctAnswers,
      accuracyRate: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
      questionsToday,
      streak: calculateStreak(attempts),
      lastActivityDate
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracyRate: 0,
      questionsToday: 0,
      streak: 0,
      lastActivityDate: null
    };
  }
}

// Get progress by subject
export async function getSubjectProgress(userId: string, subject: string): Promise<SubjectProgress> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const allAttempts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by subject (would need to join with questions collection in real app)
    const subjectAttempts = allAttempts; // Simplified for now

    const totalAttempts = subjectAttempts.length;
    const correctAttempts = subjectAttempts.filter((a: { isCorrect?: boolean }) => a.isCorrect).length;

    return {
      subject,
      totalAttempts,
      correctAttempts,
      accuracyRate: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      topics: [] // Would need to aggregate by topic
    };
  } catch (error) {
    console.error('Error fetching subject progress:', error);
    return {
      subject,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracyRate: 0,
      topics: []
    };
  }
}

// Get recent attempts
export async function getRecentAttempts(userId: string, maxAttempts: number = 10): Promise<Attempt[]> {
  try {
    const q = query(
      collection(db, 'attempts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxAttempts)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Attempt[];
  } catch (error) {
    console.error('Error fetching recent attempts:', error);
    return [];
  }
}

// Calculate streak (consecutive days of activity)
function calculateStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  const dates = attempts
    .map(a => {
      const date = a.createdAt instanceof Date ? a.createdAt : new Date();
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    })
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => b - a);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < dates.length; i++) {
    const expectedDate = todayTime - (i * oneDayMs);
    if (dates[i] === expectedDate) {
      streak++;
    } else if (i === 0 && dates[i] === todayTime - oneDayMs) {
      // Yesterday counts too if no activity today yet
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
