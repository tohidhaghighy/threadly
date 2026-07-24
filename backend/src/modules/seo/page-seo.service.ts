import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PageSeoEntity } from "../../persistence/entities/page-seo.entity";
import { UpdatePageSeoDto } from "./dto";
import { sanitizeAdminHtml } from "../../common/html-sanitize.util";

type PageSeoSeed = Pick<
  PageSeoEntity,
  "pageKey" | "label" | "path" | "title" | "titleAbsolute" | "description" | "keywords" | "noindex" | "footerBlurb"
>;

const DEFAULT_PAGES: PageSeoSeed[] = [
  {
    pageKey: "home",
    label: "صفحه اصلی",
    path: "/",
    title: null,
    titleAbsolute: "انجمن فاطر — گفتگو و ساخت کیس",
    description:
      "در انجمن گفتگوی فاطر سوال بپرسید، تجربه و اسمبل خود را به اشتراک بگذارید و پاسخ بگیرید — از مونتاژ کیس تا عیب‌یابی و گیمینگ.",
    keywords: ["انجمن فاطر", "ساخت کیس", "مونتاژ", "گیمینگ", "عیب‌یابی", "انجمن سخت‌افزار"],
    noindex: false,
    footerBlurb:
      "انجمن گفتگوی فاطر محلی برای سازندگان و علاقه‌مندان به کیس است: سوال بپرسید، تجربه مونتاژ و اسمبل خود را به اشتراک بگذارید، عیب‌یابی کنید و از پاسخ جامعه کاربران بهره ببرید. موضوعات در دسته‌های تخصصی سازمان‌دهی شده‌اند تا سریع‌تر به پاسخ برسید.",
  },
  {
    pageKey: "threads",
    label: "گفتگوها",
    path: "/threads",
    title: "گفتگوها",
    titleAbsolute: null,
    description: "مرور سوال‌ها و گفتگوهای تأیید شده در انجمن فاطر — مونتاژ کیس، عیب‌یابی و گیمینگ.",
    keywords: ["گفتگو", "سوال", "انجمن", "کیس", "سخت‌افزار"],
    noindex: false,
    footerBlurb: null,
  },
  {
    pageKey: "users",
    label: "رتبه‌بندی کاربران",
    path: "/users",
    title: "رتبه‌بندی کاربران",
    titleAbsolute: null,
    description: "رتبه‌بندی کاربران بر اساس فعالیت: موضوع، کامنت و واکنش در انجمن فاطر.",
    keywords: ["رتبه‌بندی", "امتیاز", "کاربران", "فعالیت"],
    noindex: false,
    footerBlurb: null,
  },
  {
    pageKey: "new",
    label: "ایجاد موضوع",
    path: "/new",
    title: "ایجاد موضوع",
    titleAbsolute: null,
    description: "سوال یا موضوع جدید در انجمن فاطر ثبت کنید و از جامعه پاسخ بگیرید.",
    keywords: ["ایجاد موضوع", "سوال جدید", "انجمن"],
    noindex: true,
    footerBlurb: null,
  },
  {
    pageKey: "login",
    label: "ورود",
    path: "/login",
    title: "ورود",
    titleAbsolute: null,
    description: "ورود به حساب کاربری در انجمن فاطر.",
    keywords: ["ورود", "لاگین"],
    noindex: true,
    footerBlurb: null,
  },
  {
    pageKey: "register",
    label: "ثبت‌نام",
    path: "/register",
    title: "ثبت‌نام",
    titleAbsolute: null,
    description: "ایجاد حساب کاربری جدید در انجمن فاطر.",
    keywords: ["ثبت‌نام", "عضویت"],
    noindex: true,
    footerBlurb: null,
  },
  {
    pageKey: "settings",
    label: "تنظیمات پروفایل",
    path: "/settings",
    title: "تنظیمات پروفایل",
    titleAbsolute: null,
    description: "ویرایش پروفایل کاربری در انجمن فاطر.",
    keywords: ["پروفایل", "تنظیمات"],
    noindex: true,
    footerBlurb: null,
  },
  {
    pageKey: "change-password",
    label: "تغییر رمز عبور",
    path: "/change-password",
    title: "تغییر رمز عبور",
    titleAbsolute: null,
    description: "تغییر رمز عبور حساب کاربری در انجمن فاطر.",
    keywords: ["رمز عبور", "امنیت"],
    noindex: true,
    footerBlurb: null,
  },
];

@Injectable()
export class PageSeoService implements OnModuleInit {
  constructor(@InjectRepository(PageSeoEntity) private readonly repo: Repository<PageSeoEntity>) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    for (const p of DEFAULT_PAGES) {
      const existing = await this.repo.findOne({ where: { pageKey: p.pageKey } });
      if (!existing) {
        await this.repo.save(this.repo.create(p));
        continue;
      }
      existing.label = p.label;
      existing.path = p.path;
      if (!existing.description?.trim()) existing.description = p.description;
      if (!existing.keywords?.length) existing.keywords = p.keywords;
      if (existing.footerBlurb == null && p.footerBlurb) existing.footerBlurb = p.footerBlurb;
      // Keep private routes aligned with robots.txt
      if (["new", "login", "register", "settings", "change-password"].includes(p.pageKey)) {
        existing.noindex = true;
      }
      await this.repo.save(existing);
    }
  }

  private toDto(row: PageSeoEntity) {
    return {
      pageKey: row.pageKey,
      label: row.label,
      path: row.path,
      title: row.title,
      titleAbsolute: row.titleAbsolute,
      description: row.description,
      keywords: row.keywords ?? [],
      noindex: row.noindex,
      footerBlurb: row.footerBlurb,
      updatedAt: row.updatedAt,
    };
  }

  async list() {
    const rows = await this.repo.find({ order: { label: "ASC" } });
    return { items: rows.map((r) => this.toDto(r)) };
  }

  async getByKey(pageKey: string) {
    const row = await this.repo.findOne({ where: { pageKey } });
    if (!row) throw new NotFoundException("Page SEO not found");
    return this.toDto(row);
  }

  async update(pageKey: string, dto: UpdatePageSeoDto) {
    const row = await this.repo.findOne({ where: { pageKey } });
    if (!row) throw new NotFoundException("Page SEO not found");

    if (dto.title !== undefined) row.title = dto.title?.trim() ? dto.title.trim() : null;
    if (dto.titleAbsolute !== undefined) {
      row.titleAbsolute = dto.titleAbsolute?.trim() ? dto.titleAbsolute.trim() : null;
    }
    if (typeof dto.description === "string") row.description = dto.description.trim();
    if (Array.isArray(dto.keywords)) {
      row.keywords = dto.keywords.map((k) => k.trim()).filter(Boolean);
    }
    if (typeof dto.noindex === "boolean") row.noindex = dto.noindex;
    if (dto.footerBlurb !== undefined) {
      const raw = dto.footerBlurb?.trim() ? dto.footerBlurb.trim() : null;
      row.footerBlurb = raw ? sanitizeAdminHtml(raw) : null;
    }

    await this.repo.save(row);
    return this.toDto(row);
  }
}
