import { Link, useRouterState } from "@tanstack/react-router";
import { useCategories, usePageSeo } from "@/hooks/api";
import { pathnameToPageKey } from "@/lib/page-seo";
import { getCategorySeoCopy } from "@/lib/seo-content";
import { RichTextContent } from "@/components/shared/rich-text";
import { stripHtmlToText } from "@/lib/sanitize-html";

function parseCategoryFromSearch(searchStr: string): string | null {
  if (!searchStr) return null;
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
  const category = params.get("category")?.trim();
  return category || null;
}

export function SiteSeoBlurb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const pageKey = pathnameToPageKey(pathname);
  const pageSeoQuery = usePageSeo(pageKey ?? "", { enabled: !!pageKey });
  const categoriesQuery = useCategories();
  const categories = (categoriesQuery.data?.items ?? []).filter((c) => c.isActive);

  const isHome = pathname === "/";
  const isThreadsList = pathname === "/threads" || pathname === "/threads/";
  const activeCategory = isThreadsList ? parseCategoryFromSearch(searchStr) : null;

  if (!pageKey) return null;

  const footerBlurb = pageSeoQuery.data?.footerBlurb?.trim() ?? "";
  const hasFooterBlurb = stripHtmlToText(footerBlurb).length > 0;

  if (!hasFooterBlurb && !isHome && !activeCategory) return null;

  return (
    <section
      aria-label="درباره انجمن فاطر"
      className="border-t border-border/40 bg-muted/15 px-4 py-8 md:px-6"
    >
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="text-base font-extrabold text-foreground">
          {pageSeoQuery.data?.label ? `درباره ${pageSeoQuery.data.label}` : "درباره انجمن فاطر"}
        </h2>
        {hasFooterBlurb ? (
          <RichTextContent html={footerBlurb} variant="admin" className="mt-2" />
        ) : null}

        {activeCategory ? (
          <div className="mt-6 rounded-xl border border-border/50 bg-card/60 p-4">
            {(() => {
              const cat = categories.find((c) => c.title === activeCategory);
              const copy = getCategorySeoCopy(activeCategory, cat?.description);
              return (
                <>
                  <h3 className="text-sm font-bold text-foreground">{activeCategory}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.long}</p>
                  <Link
                    to="/threads"
                    search={{ category: activeCategory }}
                    className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    مشاهده گفتگوهای {activeCategory}
                  </Link>
                </>
              );
            })()}
          </div>
        ) : isHome ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const copy = getCategorySeoCopy(cat.title, cat.description);
              return (
                <article key={cat.id} className="rounded-xl border border-border/50 bg-card/60 p-4">
                  <h3 className="text-sm font-bold text-foreground">
                    <Link
                      to="/threads"
                      search={{ category: cat.title }}
                      className="hover:text-primary hover:underline"
                    >
                      {cat.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy.long}</p>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
