export enum SRSGrade {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

export interface VocabCard {
  id: string; // The Hanzi itself can serve as ID
  hanzi: string;
  pinyin: string;
  definition: string;
  exampleSentence: string;
  exampleTranslation: string;
  
  // SRS State
  dateAdded: number;
  nextReviewDate: number; // Timestamp
  interval: number; // Days
  repetition: number; // Number of successful reviews
  easeFactor: number; // SM-2 ease factor (start at 2.5)
}

export interface ReviewStats {
  totalCards: number;
  learnedToday: number;
  dueCount: number;
  reviewsForecast: { day: string; count: number }[];
}

export type AppView = 'dashboard' | 'review' | 'learning' | 'settings';
