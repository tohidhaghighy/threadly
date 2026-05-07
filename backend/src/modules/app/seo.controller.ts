import { Controller, Get, Header, Req, type RawBodyRequest } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiExcludeController } from "@nestjs/swagger";
import { type Request } from "express";
import { Repository } from "typeorm";

import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";

/**
 * Public SEO assets that are easier to generate at the API layer than as static
 * files (e.g. dynamic sitemaps that include all approved thread URLs).
 */
@ApiExcludeController()
@Controller("api/seo")
export class SeoController {
  constructor(
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
  ) {}

  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  @Header("Cache-Control", "public, max-age=300, s-maxage=300")
  async sitemap(@Req() req: RawBodyRequest<Request>): Promise<string> {
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
    const origin = host ? `${protocol}://${host}` : "";

    const threads = await this.threadsRepo.find({
      where: { status: "approved" satisfies ThreadStatus },
      select: ["id", "updatedAt"],
      order: { updatedAt: "DESC" },
      take: 5000,
    });

    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "hourly" },
      { loc: "/threads", priority: "0.9", changefreq: "hourly" },
      { loc: "/users", priority: "0.6", changefreq: "daily" },
    ];

    const urlEntries = [
      ...staticUrls.map((u) => xmlUrl(`${origin}${u.loc}`, undefined, u.changefreq, u.priority)),
      ...threads.map((t) =>
        xmlUrl(`${origin}/threads/${t.id}`, t.updatedAt?.toISOString(), "weekly", "0.8"),
      ),
    ].join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
  }
}

function xmlUrl(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  const parts = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
