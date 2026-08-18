/**
 * One-off script: delete all threads and non-admin users.
 * Usage (from backend/): npx ts-node scripts/clear-except-admin.ts
 */
import { DataSource, Not } from "typeorm";

import { UserEntity } from "../src/persistence/entities/user.entity";
import { ThreadEntity } from "../src/persistence/entities/thread.entity";
import { ReplyEntity } from "../src/persistence/entities/reply.entity";
import { ReplyLikeEntity } from "../src/persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../src/persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../src/persistence/entities/reply-attachment.entity";
import { AttachmentEntity } from "../src/persistence/entities/attachment.entity";
import { ThreadLikeEntity } from "../src/persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../src/persistence/entities/thread-view.entity";
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

  const [threadsBefore, usersBefore] = await Promise.all([
    dataSource.getRepository(ThreadEntity).count(),
    dataSource.getRepository(UserEntity).count(),
  ]);

  await dataSource.transaction(async (manager) => {
    await manager.getRepository(ReplyAttachmentEntity).clear();
    await manager.getRepository(ReplyLikeEntity).clear();
    await manager.getRepository(ReplyReactionEntity).clear();
    await manager.getRepository(ReplyEntity).clear();
    await manager.getRepository(ThreadLikeEntity).clear();
    await manager.getRepository(ThreadViewEntity).clear();
    await manager.getRepository(AttachmentEntity).clear();
    await manager.getRepository(ThreadEntity).clear();
    await manager.getRepository(UserEntity).delete({ role: Not("admin" as const) });
  });

  const [threadsAfter, usersAfter, admins] = await Promise.all([
    dataSource.getRepository(ThreadEntity).count(),
    dataSource.getRepository(UserEntity).count(),
    dataSource.getRepository(UserEntity).find({ where: { role: "admin" }, select: ["id", "email", "name"] }),
  ]);

  console.log(`Threads: ${threadsBefore} → ${threadsAfter}`);
  console.log(`Users: ${usersBefore} → ${usersAfter}`);
  console.log(
    "Remaining admin(s):",
    admins.map((a) => `${a.name} <${a.email}>`).join(", ") || "(none)",
  );

  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
