import { getBaseUrlForSchema, SITE_NAME } from "@/lib/seo";
import { stripHtmlToText } from "@/lib/sanitize-html";

type ThreadForSchema = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: { displayName: string };
  bestReplyId: string | null;
  counts: { repliesCount: number; viewsCount: number; likesCount: number };
  image?: string | null;
};

/** A thread row on a list or category page. */
export type ThreadListSchemaItem = {
  id: string;
  title: string;
  excerpt?: string;
  category?: string;
  createdAt: string;
  author: { displayName: string };
  counts?: { repliesCount: number; viewsCount: number; likesCount: number };
};

export type CategorySchemaItem = {
  title: string;
  description?: string | null;
  threadsCount?: number;
};

type ReplyForSchema = {
  id: string;
  content: string;
  createdAt: string;
  author: { displayName: string };
  isBest: boolean;
  likesCount: number;
};

const MAX_COMMENTS = 8;
const MAX_LIST_ITEMS = 20;

function personSchema(name: string) {
  return { "@type": "Person" as const, name };
}

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return pathOrUrl;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const base = getBaseUrlForSchema();
  if (!base) return pathOrUrl;
  return `${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function threadUrl(id: string) {
  return absoluteUrl(`/threads/${id}`);
}

function categoryUrl(title: string) {
  return absoluteUrl(`/threads?category=${encodeURIComponent(title)}`);
}

function interactionStats(counts: { repliesCount: number; viewsCount: number; likesCount: number }) {
  return [
    {
      "@type": "InteractionCounter" as const,
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: counts.likesCount,
    },
    {
      "@type": "InteractionCounter" as const,
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: counts.repliesCount,
    },
    {
      "@type": "InteractionCounter" as const,
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: counts.viewsCount,
    },
  ];
}

/** DiscussionForumPosting node for one thread, suitable for embedding in an ItemList. */
export function buildThreadPostingNode(thread: ThreadListSchemaItem) {
  return {
    "@type": "DiscussionForumPosting" as const,
    headline: thread.title,
    ...(thread.excerpt ? { articleBody: thread.excerpt } : {}),
    datePublished: thread.createdAt,
    author: personSchema(thread.author.displayName),
    url: threadUrl(thread.id),
    mainEntityOfPage: threadUrl(thread.id),
    ...(thread.category ? { about: thread.category } : {}),
    ...(thread.counts ? { interactionStatistic: interactionStats(thread.counts), commentCount: thread.counts.repliesCount } : {}),
  };
}

function answerSchema(reply: ReplyForSchema, threadId: string, base: string) {
  return {
    "@type": "Answer" as const,
    text: stripHtmlToText(reply.content),
    dateCreated: reply.createdAt,
    upvoteCount: reply.likesCount,
    author: personSchema(reply.author.displayName),
    url: `${base}/threads/${threadId}#reply-${reply.id}`,
  };
}

/** Organization publisher graph for the forum brand. */
export function buildOrganizationJsonLd() {
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: base || undefined,
    logo: base ? `${base}/favicon.svg` : undefined,
    description: "انجمن گفتگو برای ساخت کیس، عیب‌یابی و گیمینگ",
    inLanguage: "fa-IR",
    sameAs: [] as string[],
  };
}

/** BreadcrumbList for SERP breadcrumb trails. */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: base ? `${base}${item.path}` : item.path,
    })),
  };
}

/** Schema.org QAPage for thread question + replies (rich results). */
export function buildThreadQaPageJsonLd(thread: ThreadForSchema, replies: ReplyForSchema[]) {
  const base = getBaseUrlForSchema();
  const accepted = replies.find((r) => r.isBest || r.id === thread.bestReplyId);
  const suggested = replies
    .filter((r) => r.id !== accepted?.id)
    .slice(0, MAX_COMMENTS)
    .map((r) => answerSchema(r, thread.id, base));

  const url = threadUrl(thread.id);
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    url,
    mainEntity: {
      "@type": "Question",
      name: thread.title,
      text: stripHtmlToText(thread.content || thread.excerpt).slice(0, 5000),
      url,
      dateCreated: thread.createdAt,
      ...(thread.updatedAt ? { dateModified: thread.updatedAt } : {}),
      author: personSchema(thread.author.displayName),
      answerCount: thread.counts.repliesCount,
      ...(accepted ? { acceptedAnswer: answerSchema(accepted, thread.id, base) } : {}),
      ...(suggested.length ? { suggestedAnswer: suggested } : {}),
    },
  };
}

/** Forum-style posting schema (supplements QAPage). */
export function buildThreadDiscussionJsonLd(thread: ThreadForSchema, replies: ReplyForSchema[] = []) {
  const base = getBaseUrlForSchema();
  const url = threadUrl(thread.id);
  const comments = replies.slice(0, MAX_COMMENTS).map((reply) => ({
    "@type": "Comment" as const,
    text: stripHtmlToText(reply.content).slice(0, 500),
    datePublished: reply.createdAt,
    author: personSchema(reply.author.displayName),
    upvoteCount: reply.likesCount,
    url: `${url}#reply-${reply.id}`,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    articleBody: stripHtmlToText(thread.content || thread.excerpt).slice(0, 5000),
    datePublished: thread.createdAt,
    ...(thread.updatedAt ? { dateModified: thread.updatedAt } : {}),
    author: personSchema(thread.author.displayName),
    url,
    mainEntityOfPage: url,
    ...(thread.image ? { image: absoluteUrl(thread.image) } : {}),
    commentCount: thread.counts.repliesCount,
    ...(comments.length ? { comment: comments } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: base || undefined,
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: base || undefined,
    },
    interactionStatistic: interactionStats(thread.counts),
    keywords: (thread.tags ?? []).join(", "),
    about: thread.category,
  };
}

/** ItemList of DiscussionForumPosting nodes — one entry per visible thread. */
export function buildThreadsItemListJsonLd(
  threads: ThreadListSchemaItem[],
  input: { name: string; path: string },
) {
  const items = threads.slice(0, MAX_LIST_ITEMS);
  if (!items.length) return null;
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: base ? `${base}${input.path}` : undefined,
    numberOfItems: items.length,
    itemListElement: items.map((thread, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: thread.title,
      url: threadUrl(thread.id),
      item: buildThreadPostingNode(thread),
    })),
  };
}

/** ItemList of CollectionPage nodes — one entry per category. */
export function buildCategoriesItemListJsonLd(categories: CategorySchemaItem[]) {
  const items = categories.slice(0, MAX_LIST_ITEMS);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "دسته‌بندی‌ها",
    numberOfItems: items.length,
    itemListElement: items.map((cat, index) => {
      const url = categoryUrl(cat.title);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: cat.title,
        url,
        item: {
          "@type": "CollectionPage",
          name: cat.title,
          description: cat.description || `گفتگوهای ${cat.title} در ${SITE_NAME}`,
          url,
          inLanguage: "fa-IR",
          ...(typeof cat.threadsCount === "number" ? { numberOfItems: cat.threadsCount } : {}),
        },
      };
    }),
  };
}

export function buildWebSiteJsonLd() {
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Fator Forum",
    description: "انجمن گفتگو برای ساخت کیس، عیب‌یابی و گیمینگ",
    url: base || undefined,
    inLanguage: "fa-IR",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: base ? { "@type": "ImageObject", url: `${base}/favicon.svg` } : undefined,
    },
    potentialAction: base
      ? {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/threads?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        }
      : undefined,
  };
}

export function buildCategoryCollectionJsonLd(input: {
  title: string;
  description: string;
  path: string;
  threadsCount?: number;
  threads?: ThreadListSchemaItem[];
}) {
  const base = getBaseUrlForSchema();
  const threads = (input.threads ?? []).slice(0, MAX_LIST_ITEMS);
  const url = base ? `${base}${input.path}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url,
    inLanguage: "fa-IR",
    ...(typeof input.threadsCount === "number" ? { numberOfItems: input.threadsCount } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: base || undefined,
    },
    ...(threads.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            name: input.title,
            numberOfItems: threads.length,
            itemListElement: threads.map((thread, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: thread.title,
              url: threadUrl(thread.id),
              item: buildThreadPostingNode(thread),
            })),
          },
        }
      : {}),
  };
}
