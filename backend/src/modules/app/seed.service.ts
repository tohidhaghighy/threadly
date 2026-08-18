import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../../persistence/entities/user.entity";
import { CategoryEntity } from "../../persistence/entities/category.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ADMIN_FAQ_ITEMS, ADMIN_FAQ_SEED_TAG } from "./seed-admin-faq.data";

@Injectable()
export class SeedService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(CategoryEntity) private readonly categoriesRepo: Repository<CategoryEntity>,
  ) {}

  async clearAllThreadsAndReplies() {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ReplyAttachmentEntity).clear();
      await manager.getRepository(ReplyLikeEntity).clear();
      await manager.getRepository(ReplyReactionEntity).clear();
      await manager.getRepository(ReplyEntity).clear();
      await manager.getRepository(ThreadLikeEntity).clear();
      await manager.getRepository(ThreadViewEntity).clear();
      await manager.getRepository(AttachmentEntity).clear();
      await manager.getRepository(ThreadEntity).clear();
    });
  }

  /** Remove all threads and every user except admin accounts. */
  async clearAllExceptAdmin() {
    await this.clearAllThreadsAndReplies();
    const result = await this.usersRepo.delete({ role: Not("admin" as const) });
    return { deletedUsers: result.affected ?? 0 };
  }

  private dedupeParagraphs(input: string): string {
    // Split by blank lines, trim, and remove duplicates while preserving order.
    const parts = input
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(p);
    }
    return out.join("\n\n").trim();
  }

  async dedupeThreadContents() {
    const threads = await this.threadsRepo.find({ select: ["id", "content"] });
    for (const t of threads) {
      const cleaned = this.dedupeParagraphs(t.content);
      if (cleaned === t.content) continue;

      await this.threadsRepo.update(t.id, {
        content: cleaned,
        excerpt: cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned,
      });
    }
  }

  async seedAdmin() {
    const email = "admin@threadly.com";
    const existing = await this.usersRepo.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash("threadly", 10);

    if (!existing) {
      const user = this.usersRepo.create({
        name: "Threadly Admin",
        email,
        passwordHash,
        role: "admin",
        status: "active",
      });
      await this.usersRepo.save(user);
      return;
    }

    if (existing.role !== "admin") {
      existing.role = "admin";
    }
    if (existing.status !== "active") {
      existing.status = "active";
    }
    // keep password deterministic for local dev convenience
    existing.passwordHash = passwordHash;
    await this.usersRepo.save(existing);
  }

  async seedCategories() {
    const defaults: Array<{ title: string; description: string; order: number }> = [
      {
        title: "مونتاژ کیس",
        description:
          "راهنمای ساخت کیس، انتخاب قطعات سازگار، مونتاژ امن، کابل‌کشی و airflow — پرسش و پاسخ با جامعه سازندگان.",
        order: 1,
      },
      {
        title: "گیمینگ و ستاپ",
        description:
          "بهینه‌سازی FPS، تنظیمات گرافیک، overclock ایمن، انتخاب مانیتور و تجربه اجرای بازی روی سخت‌افزار مختلف.",
        order: 2,
      },
      {
        title: "عیب‌یابی",
        description:
          "رفع No Display، BSOD، ریست زیر بار، دمای بالا، ناپایداری RAM/XMP و خطاهای POST — عیب‌یابی مرحله‌به‌مرحله.",
        order: 3,
      },
      {
        title: "نمایش سیستم‌ها",
        description: "اشتراک ستاپ و اسمبل، بازخورد جامعه، ایده چیدمان، RGB و مدیریت کابل.",
        order: 4,
      },
      {
        title: "مانیتور و لوازم جانبی",
        description: "انتخاب مانیتور، نرخ تازه‌سازی، کیبورد و موس گیمینگ، هدست و رابط‌های صوتی.",
        order: 5,
      },
      {
        title: "حافظه و ذخیره‌سازی",
        description: "SSD NVMe، RAID، کلون OS، عیب‌یابی سرعت درایو و انتخاب ظرفیت برای بازی و کار.",
        order: 6,
      },
    ];

    const looksBroken = (value: string | null | undefined) =>
      Boolean(value && /\?{3,}/.test(value) && !/[\u0600-\u06FF]/.test(value));

    for (const c of defaults) {
      let existing = await this.categoriesRepo.findOne({ where: { title: c.title } });
      if (!existing && c.title === "مونتاژ کیس") {
        const legacy = await this.categoriesRepo.findOne({ where: { title: "مونتاژ PC" } });
        if (legacy) {
          legacy.title = c.title;
          existing = legacy;
        }
      }
      // Repair rows corrupted by former varchar columns (stored as ????)
      if (!existing) {
        const byOrder = await this.categoriesRepo.findOne({ where: { order: c.order } });
        if (byOrder && (looksBroken(byOrder.title) || looksBroken(byOrder.description))) {
          existing = byOrder;
        }
      }
      if (!existing) {
        await this.categoriesRepo.save(
          this.categoriesRepo.create({
            title: c.title,
            description: c.description,
            order: c.order,
            isActive: true,
          }),
        );
        continue;
      }

      // keep defaults up to date for local dev convenience
      existing.title = c.title;
      existing.description = c.description;
      existing.order = c.order;
      if (existing.isActive !== true) existing.isActive = true;
      await this.categoriesRepo.save(existing);
    }

    // Drop leftover categories whose titles were permanently mangled to "?"
    const all = await this.categoriesRepo.find();
    for (const row of all) {
      if (!looksBroken(row.title)) continue;
      if (defaults.some((d) => d.order === row.order && d.title === row.title)) continue;
      await this.categoriesRepo.remove(row);
    }
  }

  /** Official FAQ threads authored by admin (idempotent via seed tag). */
  async seedAdminFaqQa() {
    const admin = await this.usersRepo.findOne({ where: { email: "admin@threadly.com" } });
    if (!admin) return;

    const looksBroken = (value: string | null | undefined) =>
      Boolean(value && /\?{3,}/.test(value) && !/[\u0600-\u06FF]/.test(value));

    // Remove FAQ rows corrupted by former varchar columns so they can be re-seeded.
    const seeded = await this.threadsRepo
      .createQueryBuilder("t")
      .where("t.tags LIKE :tag", { tag: `%${ADMIN_FAQ_SEED_TAG}%` })
      .getMany();
    for (const t of seeded) {
      if (!looksBroken(t.title) && !looksBroken(t.content)) continue;
      await this.repliesRepo.delete({ thread: { id: t.id } as any });
      await this.threadsRepo.delete(t.id);
    }

    const existing = await this.threadsRepo
      .createQueryBuilder("t")
      .where("t.tags LIKE :tag", { tag: `%${ADMIN_FAQ_SEED_TAG}%` })
      .getCount();
    if (existing >= ADMIN_FAQ_ITEMS.length) return;

    const activeCategories = await this.categoriesRepo.find({ where: { isActive: true } });
    const defaultCategory = activeCategories.find((c) => c.title === "مونتاژ کیس")?.title ?? activeCategories[0]?.title ?? "مونتاژ کیس";

    for (const item of ADMIN_FAQ_ITEMS) {
      const duplicate = await this.threadsRepo.findOne({ where: { title: item.question } });
      if (duplicate) continue;

      const category = activeCategories.some((c) => c.title === item.category) ? item.category : defaultCategory;
      const content = item.question;
      const excerpt = content.length > 160 ? `${content.slice(0, 157)}...` : content;

      const thread = await this.threadsRepo.save(
        this.threadsRepo.create({
          title: item.question,
          content,
          excerpt,
          category,
          tags: ["faq", "راهنما", ADMIN_FAQ_SEED_TAG],
          status: "approved",
          language: "fa",
          author: admin,
          approvedAt: new Date(),
          rejectedAt: null,
          repliesCount: 1,
          viewsCount: 0,
          likesCount: 0,
        }),
      );

      const reply = await this.repliesRepo.save(
        this.repliesRepo.create({
          thread,
          author: admin,
          content: item.answer,
          likesCount: 0,
        }),
      );

      thread.bestReplyId = reply.id;
      await this.threadsRepo.save(thread);
    }
  }

  seedAvatarSamples() {
    const dir = join(process.cwd(), "uploads", "avatars");
    mkdirSync(dir, { recursive: true });

    const makeAvatarSvg = (input: {
      bgA: string;
      bgB: string;
      skin: string;
      hair: string;
      shirt: string;
      accent: string;
      hairStyle: "short" | "bob" | "curly" | "hijab";
    }) => {
      const hairPath =
        input.hairStyle === "short"
          ? `<path d="M64 116c2-34 28-62 64-62s62 28 64 62c-10-16-28-28-64-28s-54 12-64 28z" fill="${input.hair}"/>`
          : input.hairStyle === "bob"
            ? `<path d="M58 128c0-44 32-78 70-78s70 34 70 78c0 20-10 42-26 54 2-10 3-18 2-26-2-22-22-38-46-38s-44 16-46 38c-1 8 0 16 2 26-16-12-26-34-26-54z" fill="${input.hair}"/>`
            : input.hairStyle === "curly"
              ? `<path d="M62 126c0-42 30-74 66-74s66 32 66 74c-4-10-10-18-18-24 0-14-12-26-26-26-6 0-12 2-16 6-4-4-10-6-16-6-14 0-26 12-26 26-8 6-14 14-18 24z" fill="${input.hair}"/>`
              : `<path d="M64 90c16-22 40-36 64-36s48 14 64 36v36c-8 18-24 34-44 44 4-16 6-30 4-40-4-24-38-38-88 0-2 10 0 24 4 40-20-10-36-26-44-44V90z" fill="${input.hair}"/>`;

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${input.bgA}"/>
      <stop offset="1" stop-color="${input.bgB}"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="256" height="256" rx="128" fill="url(#bg)"/>
  <circle cx="128" cy="128" r="92" fill="#ffffff" fill-opacity="0.16"/>

  <!-- neck + shirt -->
  <path d="M104 184c6 10 16 16 24 16s18-6 24-16v-18h-48v18z" fill="${input.skin}" opacity="0.95"/>
  <path d="M64 234c12-34 44-54 64-54s52 20 64 54" fill="${input.shirt}" filter="url(#s)"/>
  <path d="M92 202c10 8 22 12 36 12s26-4 36-12" stroke="${input.accent}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>

  <!-- head -->
  <circle cx="128" cy="126" r="56" fill="${input.skin}" filter="url(#s)"/>
  ${hairPath}

  <!-- eyes -->
  <circle cx="108" cy="126" r="6" fill="#111827"/>
  <circle cx="148" cy="126" r="6" fill="#111827"/>
  <circle cx="106" cy="124" r="2" fill="#ffffff" opacity="0.85"/>
  <circle cx="146" cy="124" r="2" fill="#ffffff" opacity="0.85"/>

  <!-- mouth -->
  <path d="M112 152c8 8 24 8 32 0" stroke="#111827" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>

  <!-- cheeks -->
  <circle cx="94" cy="148" r="10" fill="#fb7185" opacity="0.18"/>
  <circle cx="162" cy="148" r="10" fill="#fb7185" opacity="0.18"/>
</svg>`;
    };

    const samples = [
      // boys
      { bgA: "#0ea5e9", bgB: "#1d4ed8", skin: "#f2c9a0", hair: "#1f2937", shirt: "#111827", accent: "#60a5fa", hairStyle: "short" as const },
      { bgA: "#22c55e", bgB: "#15803d", skin: "#f7d3b0", hair: "#7c2d12", shirt: "#0f172a", accent: "#86efac", hairStyle: "curly" as const },
      { bgA: "#f97316", bgB: "#b45309", skin: "#eec39a", hair: "#0f172a", shirt: "#1f2937", accent: "#fdba74", hairStyle: "short" as const },
      { bgA: "#64748b", bgB: "#0f172a", skin: "#f3cfb6", hair: "#3f1d0b", shirt: "#111827", accent: "#cbd5e1", hairStyle: "curly" as const },
      // girls
      { bgA: "#a855f7", bgB: "#6d28d9", skin: "#f6d2c2", hair: "#111827", shirt: "#1f2937", accent: "#f0abfc", hairStyle: "bob" as const },
      { bgA: "#ec4899", bgB: "#be123c", skin: "#f0c8a6", hair: "#7c3aed", shirt: "#0f172a", accent: "#fda4af", hairStyle: "curly" as const },
      { bgA: "#14b8a6", bgB: "#0f766e", skin: "#f4d2b8", hair: "#111827", shirt: "#111827", accent: "#5eead4", hairStyle: "hijab" as const },
      { bgA: "#eab308", bgB: "#a16207", skin: "#f3c7a2", hair: "#4b5563", shirt: "#1f2937", accent: "#fde68a", hairStyle: "bob" as const },
    ];

    for (let i = 0; i < samples.length; i++) {
      const file = join(dir, `sample-${i + 1}.svg`);
      writeFileSync(file, makeAvatarSvg(samples[i]!), { encoding: "utf8" });
    }
  }

  async seedHardwareAssemblyQa() {
    const passwordHash = await bcrypt.hash("threadly", 10);

    const fakeUsers: Array<{ name: string; email: string; avatarUrl?: string | null }> = [
      { name: "ArminHW", email: "armin.hw@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-1.svg" },
      { name: "NedaBuild", email: "neda.build@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-5.svg" },
      { name: "SinaOC", email: "sina.oc@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-2.svg" },
      { name: "RoyaDiag", email: "roya.diag@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-6.svg" },
      { name: "KianCable", email: "kian.cable@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-3.svg" },
      { name: "MahsaRAM", email: "mahsa.ram@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-7.svg" },
      { name: "PouyaPSU", email: "pouya.psu@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-4.svg" },
      { name: "ParsaCase", email: "parsa.case@seed.threadly.local", avatarUrl: "/uploads/avatars/sample-8.svg" },
    ];

    const users: UserEntity[] = [];
    for (const u of fakeUsers) {
      let existing = await this.usersRepo.findOne({ where: { email: u.email } });
      if (!existing) {
        existing = await this.usersRepo.save(
          this.usersRepo.create({
            name: u.name,
            email: u.email,
            passwordHash,
            role: "user",
            status: "active",
            avatarUrl: u.avatarUrl ?? null,
          }),
        );
      }
      users.push(existing);
    }

    // Re-seed safely: delete previously seeded threads by these seed users.
    // Replies will be removed via CASCADE on thread delete.
    const seededEmails = fakeUsers.map((u) => u.email);
    const oldThreads = await this.threadsRepo
      .createQueryBuilder("t")
      .leftJoin("t.author", "a")
      .where("a.email IN (:...emails)", { emails: seededEmails })
      .select(["t.id"])
      .getMany();
    if (oldThreads.length) {
      await this.threadsRepo.delete(oldThreads.map((t) => t.id));
    }

    const pickUser = (i: number) => users[i % users.length]!;
    const seedTag = "seed-hw-qa-v3";

    const questions: Array<{
      title: string;
      category: string;
      tags: string[];
      content: string;
      answers: Array<{ by: number; content: string }>;
    }> = [
      {
        title: "بعد از اسمبل، سیستم روشن می‌شه ولی تصویر نمیاد (No Display)؛ از کجا شروع کنم؟",
        category: "عیب‌یابی",
        tags: ["no-display", "post", "qled", seedTag],
        content:
          "سیستم تازه اسمبل شده: فن‌ها می‌چرخن و روشنه، ولی هیچ تصویری ندارم. می‌خوام قدم‌به‌قدم و اصولی قطعه‌ی مشکل‌دار رو پیدا کنم. ترتیب عیب‌یابی استاندارد چیه؟",
        answers: [
          {
            by: 5,
            content:
              "اول Clear CMOS، بعد فقط **یک ماژول** در اسلات توصیه‌شده (معمولاً A2) بوت کن. اگر بالا اومد، همون ماژول رو روی اسلات‌های مختلف تست کن تا اسلات/CPU pin مشکل‌دار مشخص بشه. اگر هیچ‌جا بالا نمیاد، ماژول دوم رو همین‌طور. در نهایت XMP/DOCP رو خاموش نگه دار و BIOS رو آپدیت کن. DRAM LED ثابت معمولاً training/compatibility یا seating بد رم/پین‌های CPU هست.",
          },
          {
            by: 2,
            content:
              "حتماً **فشار رم تا قفل شدن دو طرفه** رو چک کن (گاهی یک طرف کامل جا نمی‌افته). اگر مادربرد 2-DIMM نیست، حتماً طبق manual اسلات‌ها. بعد از بوت، MemTest86 یک پاس کامل و بعد Karhu/HCI داخل ویندوز. اگر با XMP خطا می‌گیری، دستی: VDIMM کمی بالاتر (مثلاً 1.35→1.37)، یا Gear/CR و tRFC رو ریلکس کن.",
          },
          {
            by: 7,
            content:
              "اگر با تک‌رم هم POST نداره، پاور و کابل‌ها هم مهمن: 24pin و 8pin CPU کامل جا خورده باشن. بعضی کیس‌ها Power SW اشتباه می‌خوره ولی فن می‌چرخه. با پیچ‌گوشتی دو پین PWR روی پنل مادربرد رو کوتاه کن. همچنین مادربرد روی استندآف درست باشه؛ اتصال بدنه می‌تونه علائم عجیب بده.",
          },
        ],
      },
      {
        title: "سیستم لحظه‌ای روشن می‌شه و خاموش می‌کنه؛ اتصال بدنه/استندآف یا پاور؟",
        category: "مونتاژ PC",
        tags: ["standoff", "short", "psu", seedTag],
        content:
          "وقتی پاور رو می‌زنم سیستم یک لحظه روشن می‌شه و خاموش می‌کنه. خارج از کیس بهتره. چطور سریع تشخیص بدم مشکل از استندآف/اتصال بدنه است یا پاور/کابل؟",
        answers: [
          {
            by: 4,
            content:
              "قانون طلایی: **فقط** استندآف‌هایی که دقیقاً زیر سوراخ‌های مادربرد هستن نصب بشن. یک استندآف اضافه زیر PCB می‌تونه اتصال کوتاه بده. تست سریع: خارج از کیس (bench test) با یک رم + CPU + کولر + GPU (اگر لازم) روی جعبه مادربرد. اگر بیرون کیس پایدار شد ولی داخل کیس نه، ۹۰٪ مشکل استندآف/فشار/اتصال بدنه است.",
          },
          {
            by: 8,
            content:
              "علائم: روشن/خاموش لحظه‌ای، ریست‌های تصادفی، یا اصلاً روشن نشدن با اینکه پاور سالمه. پیچ‌ها رو بیش از حد سفت نکن (PCB خم می‌شه). بعضی کیس‌ها شیلد IO فنری دارن؛ اگر زبانه‌ها داخل پورت‌ها گیر کنن هم می‌تونه اتصال/اختلال بده.",
          },
        ],
      },
      {
        title: "چینش فن‌ها و Airflow استاندارد؛ چرا کیس گردوغبار می‌گیره و دما بالا می‌ره؟",
        category: "مونتاژ PC",
        tags: ["airflow", "fans", "dust", seedTag],
        content:
          "کیس مش دارم ولی هم دما بالاست هم گردوغبار زیاد می‌شه. intake/outtake و فشار مثبت/منفی رو چطور درست تنظیم کنم؟",
        answers: [
          {
            by: 1,
            content:
              "سناریوی عمومی: جلو **intake** (۲–۳ فن)، بالا **outtake** (رادیاتور هم معمولاً بالا outtake) و پشت outtake. این باعث فشار مثبت ملایم می‌شه و گردوغبار کمتر وارد می‌شه (با فیلتر). اگر رادیاتور جلو intake باشه، CPU خنک‌تر ولی GPU گرم‌تر می‌شه؛ انتخاب با اولویت شماست.",
          },
          {
            by: 7,
            content:
              "برای AIO مهمه که **پمپ پایین‌ترین نقطه‌ی حلقه نباشه** و حباب هوا تو پمپ گیر نکنه. اگر رادیاتور جلو نصب می‌کنی، بهتره لوله‌ها پایین باشن (tube-down) تا هوا بالای رادیاتور جمع بشه نه تو پمپ.",
          },
        ],
      },
      {
        title: "رم درست بالا نمیاد یا با XMP ناپایداره؛ روش تست رم (ماژول/اسلات) چیه؟",
        category: "حافظه و ذخیره‌سازی",
        tags: ["ram", "xmp", "stability", seedTag],
        content:
          "دو تا رم دارم. گاهی POST سخت می‌شه یا با XMP کرش می‌کنه. روش استاندارد تست رم و اسلات‌ها چیه؟",
        answers: [
          {
            by: 6,
            content:
              "روی اکثر مادربردهای 4-DIMM، اسلات‌های نزدیک‌تر به CPU (A1/B1) طول مسیر/سیگنال متفاوت دارن. چینش توصیه‌شده A2/B2 برای پایداری بهتر و training راحت‌تره. اگر اشتباه بذاری ممکنه تک‌کاناله بشه یا با XMP ناپایدار بشه (به‌خصوص فرکانس‌های بالا).",
          },
          {
            by: 3,
            content:
              "تک‌کاناله بودن فقط پهنای‌باند رو نصف نمی‌کنه؛ بعضی workloadها و iGPUها خیلی افت می‌کنن. اگر هدف OC/XMP هست، همیشه manual مادربرد رو ملاک بگیر چون بعضی بردها labeling متفاوت دارن.",
          },
        ],
      },
      {
        title: "زیر بار بازی ریست/BSOD دارم؛ چطور رم/گرافیک/پاور رو تفکیک کنم؟",
        category: "عیب‌یابی",
        tags: ["bsod", "reboot", "whea", seedTag],
        content:
          "در کار سبک مشکلی نیست، اما تو بازی سنگین کرش/BSOD/ریست می‌خورم. چه تست‌هایی بزنم که بفهمم مشکل از رم/گرافیک/پاور/دماست؟",
        answers: [
          {
            by: 6,
            content:
              "اول BIOS آپدیت. بعد از پروفایل، تست سریع: TM5 anta777 یا Karhu. اگر خطا داری: VDIMM کمی بالا، SOC/VCCSA/VCCIO (بسته به پلتفرم) در حد معقول، Command Rate از 1T به 2T، یا tRFC/tFAW ریلکس. اگر 2x16 دو رنک باشه ممکنه به ولتاژ/فرکانس حساس‌تر باشه.",
          },
          {
            by: 3,
            content:
              "همه چیز رو همزمان دست نزن. یک تغییر، تست، بعدی. هدف پایداریه نه صرفاً بوت. اگر فقط بازی کرش می‌ده ولی تست رم پاس می‌شه، GPU OC و undervolt و PSU ripple هم بررسی کن.",
          },
        ],
      },
      // --- Remaining 45 Qs generated as compact but technical items ---
    ];

    // Generate the remaining questions (to reach exactly 50) with deterministic content.
    const generated: typeof questions = [];
    const gen = (n: number) => {
      const items: Array<Omit<(typeof questions)[number], "answers"> & { answers: (typeof questions)[number]["answers"] }> = [];
      // a pool of high-signal topics, each will create one Q with 2 answers
      const pool: Array<{
        title: string;
        category: string;
        tags: string[];
        content: string;
        a1: string;
        a2: string;
      }> = [
        {
          title: "کابل‌کشی پنل جلوی کیس (Front Panel)؛ PWR/RESET/HDD LED را چطور بدون اشتباه ببندیم؟",
          category: "مونتاژ PC",
          tags: ["front-panel", "header", "case", seedTag],
          content: "سیستم روشن نمی‌شه یا LEDها کار نمی‌کنن. روش اتصال و تست سریع چیه؟",
          a1: "طبق manual مادربرد (F_PANEL). LEDها قطبیت دارن. برای تست روشن شدن، دو پین PWR را لحظه‌ای کوتاه کن.",
          a2: "کابل‌ها را طوری روت کن که کشش روی هدر نباشه. اگر با کوتاه کردن پین‌ها روشن شد، مشکل از کلید/کابل کیس است.",
        },
        {
          title: "کابل‌های PSU و اشتباه‌های رایج (EPS/PCIe/ماژولار)",
          category: "مونتاژ PC",
          tags: ["psu", "cables", "eps", "pcie", seedTag],
          content: "کابل 8pin CPU و 8pin PCIe شبیه‌ان. چه خطری داره و بهترین روش اتصال چیه؟",
          a1: "EPS و PCIe پین‌آوت فرق دارن؛ زورکی جا نزن. کابل‌های ماژولار برندهای مختلف را قاطی نکن.",
          a2: "برای GPUهای قوی، دو کابل جدا برای دو 8pin بهتره (نه daisy-chain) تا افت ولتاژ/داغی کمتر بشه.",
        },
        {
          title: "رام (RAM) درست جا نمی‌افته یا POST سخت می‌شه؛ seating و تست ماژول/اسلات",
          category: "حافظه و ذخیره‌سازی",
          tags: ["ram", "post", "seating", seedTag],
          content: "فن‌ها می‌چرخن ولی DRAM LED روشنه. چطور سریع بفهمیم رم/اسلات/سوکت مشکل داره؟",
          a1: "تک‌ماژول در اسلات توصیه‌شده (اغلب A2) + Clear CMOS. اگر بالا اومد، همون ماژول را روی اسلات‌های دیگر تست کن.",
          a2: "اگر با هیچ ترکیبی POST نمی‌شه، پین‌های سوکت CPU (مسیرهای مموری) و فشار کولر/خم شدن برد را هم بررسی کن.",
        },
        {
          title: "سیستم روشن می‌شه ولی خاموش/ریست می‌کنه؛ اتصال بدنه یا PSU?",
          category: "عیب‌یابی",
          tags: ["reboot", "short", "standoff", "psu", seedTag],
          content: "سیستم یک لحظه روشن می‌شه و خاموش می‌کنه. روند استاندارد تشخیص؟",
          a1: "bench test بیرون کیس. اگر بیرون پایدار شد، استندآف اضافه/اتصال بدنه. اگر بیرون هم خاموش شد، PSU/کابل‌ها/قطعه مشکل‌دار.",
          a2: "24pin و EPS 8pin را دوباره جا بزن. کلیک تکرارشونده معمولاً حفاظت PSU به‌علت short یا بار غیرعادیه.",
        },
        {
          title: "عدم تصویر (No Display) با وجود روشن بودن سیستم؛ HDMI/DP و خروجی اشتباه",
          category: "عیب‌یابی",
          tags: ["no-display", "gpu", "cable", seedTag],
          content: "تصویر نمیاد ولی سیستم روشنه. چه تست‌هایی سریع‌تر جواب می‌ده؟",
          a1: "کابل را عوض کن (HDMI/DP) و پورت دیگر مانیتور/کارت. اگر GPU داری، کابل باید به GPU وصل باشد نه مادربرد.",
          a2: "Q-LED (VGA/DRAM) را ببین. GPU را دوباره جا بزن و برق PCIe را با کابل جدا تست کن.",
        },
        {
          title: "XMP/EXPO ناپایدار است؛ تنظیمات حداقلی برای پایدار کردن",
          category: "حافظه و ذخیره‌سازی",
          tags: ["xmp", "expo", "stability", seedTag],
          content: "با XMP بالا میاد ولی در بازی کرش می‌ده. چه کارهایی اولویت دارن؟",
          a1: "BIOS آپدیت، سپس تست TM5/Karhu. اگر خطا داری: کمی افزایش VDIMM و ریلکس کردن CR به 2T یا کاهش یک پله فرکانس.",
          a2: "همه چیز را همزمان تغییر نده. یک تغییر، تست، بعدی. اگر فقط بازی کرش می‌ده، GPU/PSU هم بررسی کن.",
        },
        {
          title: "دمای CPU بالا یا Throttle؛ نصب کولر/خمیر/کنترل فن",
          category: "عیب‌یابی",
          tags: ["temps", "cpu", "cooler", seedTag],
          content: "بعد از اسمبل دمای CPU بالاست. چک‌لیست سریع؟",
          a1: "فن روی CPU_FAN و پروفایل PWM درست. پیچ‌ها ضربدری. خمیر به مقدار مناسب. برچسب پلاستیکی زیر کولر جدا شده باشد.",
          a2: "اگر AIO داری: پمپ روی هدر مناسب و سرعت ثابت. airflow کیس و جهت فن‌ها را هم درست کن.",
        },
        {
          title: "SSD M.2 دیده نمی‌شه یا سرعت افت می‌کنه؛ نصب و خنک‌کاری",
          category: "حافظه و ذخیره‌سازی",
          tags: ["m2", "ssd", "throttle", seedTag],
          content: "NVMe یا شناسایی نمی‌شه یا throttle می‌کنه. علت‌های رایج؟",
          a1: "standoff سایز درست + جا زدن زاویه‌دار. در BIOS اشتراک‌گذاری lanes با SATA/PCIe را چک کن.",
          a2: "پد حرارتی بدون روکش پلاستیک + هیت‌سینک و airflow؛ اسلات زیر GPU معمولاً گرم‌تره.",
        },
        {
          title: "کار نکردن USBهای پنل جلو؛ هدر USB 3.0/Type-C و پین خم شده",
          category: "عیب‌یابی",
          tags: ["usb", "front-io", "header", seedTag],
          content: "USB جلو قطع و وصل می‌شه یا کار نمی‌کنه. چه چیزهایی رو چک کنیم؟",
          a1: "کانکتور USB3 داخلی را مستقیم و بدون فشار جا بزن؛ پین‌های خم شده خیلی رایجه. مسیر کابل را بدون کشش تنظیم کن.",
          a2: "اگر Type-C جلو داری، باید هدر USB-C روی مادربرد وجود داشته باشه. Power management ویندوز هم گاهی باعث قطع و وصل می‌شه.",
        },
        {
          title: "RGB vs ARGB؛ اشتباه زدن 5V/12V چه آسیبی می‌زنه؟",
          category: "مونتاژ PC",
          tags: ["rgb", "argb", "headers", seedTag],
          content: "فن‌ها می‌چرخن ولی نور ندارن (یا بالعکس). تفاوت کانکتورها و خطر اشتباه؟",
          a1: "ARGB معمولاً 3pin 5V و RGB 4pin 12V است. اشتباه زدن می‌تونه LEDها رو بسوزونه. برچسب 5V و 12V را چک کن.",
          a2: "اگر هاب استفاده می‌کنی، تغذیه SATA و محدودیت آمپر هدرها مهمه. تعداد فن زیاد را مستقیم به یک هدر نزن.",
        },
      ];

      // Repeat pattern with variations to reach n items.
      for (let i = 0; i < n; i++) {
        const p = pool[i % pool.length]!;
        items.push({
          title:
            i === 0
              ? "بهترین ترتیب تست قطعات بعد از اسمبل (Checklist حرفه‌ای) چیه؟"
              : i === 1
                ? "سیستم روشن می‌شه ولی تصویر ندارم؛ تست بدون GPU/با iGPU چطور؟"
                : i === 2
                  ? "LEDهای مادربرد (CPU/DRAM/VGA/BOOT) دقیقاً چه معنی دارن؟"
                  : i === 3
                    ? "چرا با 4 تا رم، فرکانس XMP پایین‌تر میاد یا ناپایدار می‌شه؟"
                    : i === 4
                      ? "تشخیص رم تک‌رنک/دو رنک و اثرش روی کارایی و پایداری"
                      : `${p.title} (نکته ${i + 1})`,
          category: p.category,
          tags: p.tags,
          content:
            i < 5
              ? [
                  "یک سیستم تازه اسمبل شده دارم و می‌خوام قبل از نصب ویندوز مطمئن شم همه‌چیز پایدار و درست مونتاژ شده. چه تست‌ها و چک‌لیستی پیشنهاد می‌دید؟",
                  "کیس روشن می‌شه ولی صفحه سیاهه. iGPU دارم. برای ایزوله کردن مشکل (GPU/کابل/مانیتور/BIOS) دقیقاً چه تست‌هایی انجام بدم؟",
                  "روی مادربرد Q-LED روشن می‌مونه. معنی دقیق CPU/DRAM/VGA/BOOT چیه و برای هرکدوم اولین اقدامات استاندارد چیه؟",
                  "چهار ماژول رم نصب کردم و با XMP سیستم ناپایداره. علت‌های سیگنالینگ/IMC و راهکارهای عملی چیه؟",
                  "می‌خوام بفهمم رمم single-rank هست یا dual-rank و این روی پهنای‌باند/latency و OC چه اثری داره. بهترین روش تشخیص چیه؟",
                ][i]!
              : p.content,
          answers: [
            { by: (i + 1) % users.length, content: i < 5 ? p.a1 : p.a1 },
            { by: (i + 3) % users.length, content: i < 5 ? p.a2 : p.a2 },
          ],
        });
      }
      return items;
    };

    const need = 50 - questions.length;
    const rest = gen(Math.max(0, need));
    for (const r of rest) {
      generated.push({
        title: r.title,
        category: r.category,
        tags: r.tags,
        content: r.content,
        answers: r.answers,
      });
    }

    const all = [...questions, ...generated].slice(0, 50);

    // Ensure categories exist (seedCategories should have already run, but keep robust).
    const activeCategories = await this.categoriesRepo.find();
    const catTitles = new Set(activeCategories.map((c) => c.title));
    for (const c of ["مونتاژ PC", "عیب‌یابی", "حافظه و ذخیره‌سازی"]) {
      if (!catTitles.has(c)) {
        await this.categoriesRepo.save(
          this.categoriesRepo.create({ title: c, description: null, order: 99, isActive: true }),
        );
      }
    }

    for (let i = 0; i < all.length; i++) {
      const q = all[i]!;
      const author = pickUser(i);
      const excerpt = q.content.length > 160 ? `${q.content.slice(0, 157)}...` : q.content;

      const thread = await this.threadsRepo.save(
        this.threadsRepo.create({
          title: q.title,
          content: q.content,
          excerpt,
          category: q.category,
          tags: q.tags,
          status: "approved",
          language: "fa",
          author,
          approvedAt: new Date(),
          rejectedAt: null,
          repliesCount: 0,
          viewsCount: 0,
          likesCount: 0,
        }),
      );

      let repliesCount = 0;
      for (const a of q.answers) {
        const replyAuthor = pickUser(a.by);
        await this.repliesRepo.save(
          this.repliesRepo.create({
            thread,
            author: replyAuthor,
            content: a.content,
            likesCount: 0,
          }),
        );
        repliesCount++;
      }

      if (repliesCount > 0) {
        thread.repliesCount = repliesCount;
        await this.threadsRepo.save(thread);
      }
    }
  }
}

