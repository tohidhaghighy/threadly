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
};

type ReplyForSchema = {
  id: string;
  content: string;
  createdAt: string;
  author: { displayName: string };
  isBest: boolean;
  likesCount: number;
};

function personSchema(name: string) {
  return { "@type": "Person" as const, name };
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
  const suggested = replies.filter((r) => r.id !== accepted?.id).map((r) => answerSchema(r, thread.id, base));

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: thread.title,
      text: stripHtmlToText(thread.content || thread.excerpt),
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
export function buildThreadDiscussionJsonLd(thread: ThreadForSchema) {
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    articleBody: stripHtmlToText(thread.content || thread.excerpt),
    datePublished: thread.createdAt,
    ...(thread.updatedAt ? { dateModified: thread.updatedAt } : {}),
    author: personSchema(thread.author.displayName),
    url: `${base}/threads/${thread.id}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: base || undefined,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: thread.counts.likesCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: thread.counts.repliesCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: thread.counts.viewsCount,
      },
    ],
    keywords: (thread.tags ?? []).join(", "),
    about: thread.category,
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
}) {
  const base = getBaseUrlForSchema();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url: base ? `${base}${input.path}` : undefined,
    inLanguage: "fa-IR",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: base || undefined,
    },
  };
}
