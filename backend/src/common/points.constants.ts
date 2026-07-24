/** Activity points used for leaderboard / profile scoring. */
export const POINTS = {
  thread: 2,
  reply: 2,
  reaction: 1,
} as const;

/** Level 4 starts at 160 pts — users at level 4+ must set a mobile number. */
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
