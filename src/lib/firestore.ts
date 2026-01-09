import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types for Firestore collections
export interface Document {
  id?: string;
  userId: string;
  title: string;
  content: string | null;
  summary: string | null;
  fileType: string;
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  language: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FlashcardDeck {
  id?: string;
  userId: string;
  documentId: string;
  title: string;
  createdAt: Timestamp;
}

export interface Flashcard {
  id?: string;
  userId: string;
  deckId: string;
  front: string;
  back: string;
  difficulty: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: Timestamp;
  createdAt: Timestamp;
}

export interface Quiz {
  id?: string;
  userId: string;
  documentId: string;
  title: string;
  questions: any[];
  difficulty: string;
  createdAt: Timestamp;
}

export interface MindMap {
  id?: string;
  userId: string;
  documentId: string;
  title: string;
  nodes: any[];
  createdAt: Timestamp;
}

export interface Summary {
  id?: string;
  userId: string;
  documentId: string;
  shortSummary: string | null;
  longSummary: string | null;
  keyConcepts: any[];
  createdAt: Timestamp;
}

// Collection references
const documentsRef = collection(db, 'documents');
const flashcardDecksRef = collection(db, 'flashcard_decks');
const flashcardsRef = collection(db, 'flashcards');
const quizzesRef = collection(db, 'quizzes');
const mindMapsRef = collection(db, 'mind_maps');
const summariesRef = collection(db, 'summaries');

// Documents
export const firestoreDocuments = {
  async create(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(documentsRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getById(id: string) {
    const docSnap = await getDoc(doc(db, 'documents', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Document;
    }
    return null;
  },

  async getByUserId(userId: string) {
    const q = query(documentsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Document[];
  },

  async update(id: string, data: Partial<Document>) {
    const docRef = doc(db, 'documents', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'documents', id));
  }
};

// Flashcard Decks
export const firestoreFlashcardDecks = {
  async create(data: Omit<FlashcardDeck, 'id' | 'createdAt'>) {
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(flashcardDecksRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getById(id: string) {
    const docSnap = await getDoc(doc(db, 'flashcard_decks', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FlashcardDeck;
    }
    return null;
  },

  async getByUserId(userId: string) {
    const q = query(flashcardDecksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FlashcardDeck[];
  },

  async getByDocumentId(documentId: string) {
    const q = query(flashcardDecksRef, where('documentId', '==', documentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FlashcardDeck[];
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'flashcard_decks', id));
  }
};

// Flashcards
export const firestoreFlashcards = {
  async create(data: Omit<Flashcard, 'id' | 'createdAt'>) {
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(flashcardsRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getByDeckId(deckId: string) {
    const q = query(flashcardsRef, where('deckId', '==', deckId), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Flashcard[];
  },

  async update(id: string, data: Partial<Flashcard>) {
    await updateDoc(doc(db, 'flashcards', id), data);
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'flashcards', id));
  }
};

// Quizzes
export const firestoreQuizzes = {
  async create(data: Omit<Quiz, 'id' | 'createdAt'>) {
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(quizzesRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getById(id: string) {
    const docSnap = await getDoc(doc(db, 'quizzes', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
    return null;
  },

  async getByUserId(userId: string) {
    const q = query(quizzesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quiz[];
  },

  async getByDocumentId(documentId: string) {
    const q = query(quizzesRef, where('documentId', '==', documentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quiz[];
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'quizzes', id));
  }
};

// Mind Maps
export const firestoreMindMaps = {
  async create(data: Omit<MindMap, 'id' | 'createdAt'>) {
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(mindMapsRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getById(id: string) {
    const docSnap = await getDoc(doc(db, 'mind_maps', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MindMap;
    }
    return null;
  },

  async getByUserId(userId: string) {
    const q = query(mindMapsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MindMap[];
  },

  async getByDocumentId(documentId: string) {
    const q = query(mindMapsRef, where('documentId', '==', documentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MindMap[];
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'mind_maps', id));
  }
};

// Summaries
export const firestoreSummaries = {
  async create(data: Omit<Summary, 'id' | 'createdAt'>) {
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(summariesRef, docData);
    return { id: docRef.id, ...docData };
  },

  async getById(id: string) {
    const docSnap = await getDoc(doc(db, 'summaries', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Summary;
    }
    return null;
  },

  async getByUserId(userId: string) {
    const q = query(summariesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Summary[];
  },

  async getByDocumentId(documentId: string) {
    const q = query(summariesRef, where('documentId', '==', documentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Summary[];
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'summaries', id));
  }
};
