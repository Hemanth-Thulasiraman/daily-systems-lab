export type Rating = "again" | "hard" | "good" | "easy";

export interface SM2State {
  repetitions: number;
  easeFactor: number;
  interval: number;
}

const RATING_SCORES: Record<Rating, number> = {
  again: 0,
  hard: 2,
  good: 3,
  easy: 5,
};

export function calculateNextReview(state: SM2State, rating: Rating): SM2State & { nextReviewAt: Date } {
  const score = RATING_SCORES[rating];
  let { repetitions, easeFactor, interval } = state;

  if (score < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { repetitions, easeFactor, interval, nextReviewAt };
}

export function getDueCount(nextReviewAt: Date): boolean {
  return new Date() >= nextReviewAt;
}
