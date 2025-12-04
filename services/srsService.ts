import { VocabCard, SRSGrade } from '../types';

/**
 * Calculates the next review parameters based on a modified SM-2 algorithm.
 * 
 * Rules:
 * 1. If GRADE is AGAIN (Unknown) -> Due immediately (or very short interval).
 * 2. If GRADE is GOOD/EASY (Known) AND it's a new card -> Interval is ~7 days (as requested).
 */
export const calculateReview = (card: VocabCard, grade: SRSGrade): Partial<VocabCard> => {
  const now = Date.now();
  let { interval, repetition, easeFactor } = card;

  // Case 1: The user does NOT know the word.
  if (grade === SRSGrade.AGAIN) {
    return {
      repetition: 0,
      interval: 0, // Reset to 0 (review same session or immediately)
      nextReviewDate: now, // Due now
      easeFactor: Math.max(1.3, easeFactor - 0.2),
    };
  }

  // Case 2: The user KNOWS the word.
  // Standard SM-2 Ease Factor calculation
  // q maps 0-5. Our grades: Hard(1), Good(2), Easy(3).
  // We map Hard->3, Good->4, Easy->5
  const q = grade + 2; 
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Interval Calculation
  if (repetition === 0) {
    // New card just learned correctly
    // Requirement: "if i know the word then it should also test maybe a week later"
    interval = 7; 
  } else if (repetition === 1) {
    // Second successful review
    interval = 14; 
  } else {
    // Subsequent reviews: Previous Interval * EF
    interval = Math.ceil(interval * easeFactor);
  }

  repetition++;

  // Calculate next date (milliseconds)
  const oneDay = 24 * 60 * 60 * 1000;
  const nextReviewDate = now + (interval * oneDay);

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate
  };
};

export const createNewCard = (
  hanzi: string,
  pinyin: string,
  definition: string,
  exampleSentence: string,
  exampleTranslation: string
): VocabCard => {
  return {
    id: hanzi,
    hanzi,
    pinyin,
    definition,
    exampleSentence,
    exampleTranslation,
    dateAdded: Date.now(),
    nextReviewDate: Date.now(), // Due immediately
    interval: 0,
    repetition: 0,
    easeFactor: 2.5
  };
};