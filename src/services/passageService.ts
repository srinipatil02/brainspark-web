import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Passage, FirestorePassage } from '@/types';
import { transformFirestorePassage } from './questionTransformer';

/**
 * Fetch a passage by ID for reading comprehension questions
 */
export async function getPassage(passageId: string): Promise<Passage | null> {
  try {
    const docRef = doc(db, 'passages', passageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return transformFirestorePassage(docSnap.data() as FirestorePassage);
    }

    console.log(`Passage not found: ${passageId}`);
    return null;
  } catch (error) {
    console.error('Error fetching passage:', error);
    return null;
  }
}

/**
 * Fetch multiple passages by IDs
 */
export async function getPassages(passageIds: string[]): Promise<Map<string, Passage>> {
  const passageMap = new Map<string, Passage>();

  // Fetch passages in parallel
  const promises = passageIds.map(async (id) => {
    const passage = await getPassage(id);
    if (passage) {
      passageMap.set(id, passage);
    }
  });

  await Promise.all(promises);
  return passageMap;
}
