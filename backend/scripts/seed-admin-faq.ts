/**
 * Seed official admin FAQ threads. Safe to run multiple times (idempotent).
 * Usage (from backend/): npm run db:seed-faq
 */
import { DataSource } from "typeorm";

import { UserEntity } from "../src/persistence/entities/user.entity";
import { ThreadEntity } from "../src/persistence/entities/thread.entity";
import { ReplyEntity } from "../src/persistence/entities/reply.entity";
import { CategoryEntity } from "../src/persistence/entities/category.entity";
import { ADMIN_FAQ_ITEMS, ADMIN_FAQ_SEED_TAG } from "../src/modules/app/seed-admin-faq.data";
import {
  buildMssqlDataSourceOptions,
  DEFAULT_MSSQL_CONNECTION_STRING,
} from "../src/persistence/typeorm.config";

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
  const threadsRepo = dataSource.getRepository(ThreadEntity);
  const repliesRepo = dataSource.getRepository(ReplyEntity);
  const categoriesRepo = dataSource.getRepository(CategoryEntity);

  const admin = await usersRepo.findOne({ where: { email: "admin@threadly.com" } });
  if (!admin) {
    console.error("Admin user not found. Start the backend once to seed admin.");
    process.exit(1);
  }

  const activeCategories = await categoriesRepo.find({ where: { isActive: true } });
  const defaultCategory =
    activeCategories.find((c) => c.title === "مونتاژ کیس")?.title ?? activeCategories[0]?.title ?? "مونتاژ کیس";

  let created = 0;
  let skipped = 0;

  for (const item of ADMIN_FAQ_ITEMS) {
    const duplicate = await threadsRepo.findOne({ where: { title: item.question } });
    if (duplicate) {
      skipped++;
      continue;
    }

    const category = activeCategories.some((c) => c.title === item.category) ? item.category : defaultCategory;
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
    created++;
  }

  console.log(`Admin FAQ: ${created} created, ${skipped} skipped (already exist)`);

  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
