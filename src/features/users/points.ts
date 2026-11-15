/** Keep in sync with `backend/src/common/points.constants.ts`. */
export const POINTS = {
  thread: 2,
  reply: 2,
  reaction: 1,
} as const;

/** Users at this level or higher must provide a mobile number. */
export const PHONE_REQUIRED_MIN_LEVEL = 4;

/** Level 4 starts at 160 pts — keep in sync with `src/lib/gamification.ts`. */
export const PHONE_REQUIRED_MIN_POINTS = 160;

export function scoreFromCounts(counts: {
  threads: number;
  comments: number;
  reactions: number;
}): number {
  return (
    counts.threads * POINTS.thread +
    counts.comments * POINTS.reply +
    counts.reactions * POINTS.reaction
  );
}
