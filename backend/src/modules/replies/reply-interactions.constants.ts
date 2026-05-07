/** Allowed emoji reactions on replies (toggle per user per emoji). */
export const REPLY_REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👀", "🙏"] as const;

export type ReplyReactionEmoji = (typeof REPLY_REACTION_EMOJIS)[number];

export function isAllowedReplyReactionEmoji(s: string): s is ReplyReactionEmoji {
  return (REPLY_REACTION_EMOJIS as readonly string[]).includes(s);
}
