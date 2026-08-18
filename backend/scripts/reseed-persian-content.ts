/**
 * After varchar→nvarchar conversion, re-apply Persian seed content.
 * Corrupted "????" rows cannot be recovered — this replaces seed categories,
 * page SEO defaults, and admin FAQ threads.
 *
 * Usage (from backend/):
 *   npx ts-node scripts/reseed-persian-content.ts
 */
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";

import { UserEntity } from "../src/persistence/entities/user.entity";
import { ThreadEntity } from "../src/persistence/entities/thread.entity";
import { ReplyEntity } from "../src/persistence/entities/reply.entity";
import { CategoryEntity } from "../src/persistence/entities/category.entity";
import { ADMIN_FAQ_ITEMS, ADMIN_FAQ_SEED_TAG } from "../src/modules/app/seed-admin-faq.data";
import {
  buildMssqlDataSourceOptions,
  DEFAULT_MSSQL_CONNECTION_STRING,
} from "../src/persistence/typeorm.config";

const CATEGORY_DEFAULTS: Array<{ title: string; description: string; order: number }> = [
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

async function main() {
  if (!process.env.DB_CONNECTION_STRING && !process.env.DB_HOST) {
    process.env.DB_CONNECTION_STRING = DEFAULT_MSSQL_CONNECTION_STRING;
  }

  const dataSource = new DataSource(
    buildMssqlDataSourceOptions(
      { get: (key) => process.env[key] },
      { synchronize: false },
    ),
  );
  await dataSource.initialize();

  const usersRepo = dataSource.getRepository(UserEntity);
  const categoriesRepo = dataSource.getRepository(CategoryEntity);
  const threadsRepo = dataSource.getRepository(ThreadEntity);
  const repliesRepo = dataSource.getRepository(ReplyEntity);

  // Ensure admin exists
  let admin = await usersRepo.findOne({ where: { email: "admin@threadly.com" } });
  if (!admin) {
    admin = await usersRepo.save(
      usersRepo.create({
        name: "Threadly Admin",
        email: "admin@threadly.com",
        passwordHash: await bcrypt.hash("threadly", 10),
        role: "admin",
        status: "active",
      }),
    );
    console.log("Created admin user");
  }

  await dataSource.transaction(async (manager) => {
    // Prefer DELETE over TRUNCATE — SQL Server blocks TRUNCATE when FKs reference the table.
    await manager.query(`DELETE FROM reply_attachments`);
    await manager.query(`DELETE FROM reply_likes`);
    await manager.query(`DELETE FROM reply_reactions`);
    await manager.query(`UPDATE threads SET bestReplyId = NULL`);
    await manager.query(`DELETE FROM replies`);
    await manager.query(`DELETE FROM thread_likes`);
    await manager.query(`DELETE FROM thread_views`);
    await manager.query(`DELETE FROM attachments`);
    await manager.query(`DELETE FROM threads`);
    await manager.query(`DELETE FROM users WHERE role <> 'admin'`);
    await manager.query(`DELETE FROM categories`);
    await manager.query(`DELETE FROM page_seo`);
  });
  console.log("Cleared threads, non-admin users, categories, and page_seo");

  for (const c of CATEGORY_DEFAULTS) {
    await categoriesRepo.save(
      categoriesRepo.create({
        title: c.title,
        description: c.description,
        order: c.order,
        isActive: true,
        seoKeywords: [],
      }),
    );
  }
  console.log(`Seeded ${CATEGORY_DEFAULTS.length} categories`);

  // page_seo is recreated by PageSeoService on backend boot
  console.log("page_seo cleared — restart backend to restore SEO defaults");

  const activeCategories = await categoriesRepo.find({ where: { isActive: true } });
  const defaultCategory =
    activeCategories.find((c) => c.title === "مونتاژ کیس")?.title ??
    activeCategories[0]?.title ??
    "مونتاژ کیس";

  for (const item of ADMIN_FAQ_ITEMS) {
    const category = activeCategories.some((c) => c.title === item.category)
      ? item.category
      : defaultCategory;
    const content = item.question;
    const excerpt = content.length > 160 ? `${content.slice(0, 157)}...` : content;

    const thread = await threadsRepo.save(
      threadsRepo.create({
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

    const reply = await repliesRepo.save(
      repliesRepo.create({
        thread,
        author: admin,
        content: item.answer,
        likesCount: 0,
      }),
    );

    thread.bestReplyId = reply.id;
    await threadsRepo.save(thread);
  }
  console.log(`Seeded ${ADMIN_FAQ_ITEMS.length} FAQ threads`);

  const sample = await categoriesRepo.find({ order: { order: "ASC" }, take: 3 });
  console.log(
    "Sample categories:",
    sample.map((c) => c.title).join(" | "),
  );

  await dataSource.destroy();
  console.log("Done. Restart the backend so page SEO defaults re-apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
