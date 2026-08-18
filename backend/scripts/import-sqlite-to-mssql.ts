/**
 * Import all rows from backend/server-threadly.sqlite into SQL Server.
 *
 * Usage (from backend/):
 *   npm run db:import-sqlite
 *
 * WARNING: clears existing forum data in SQL Server, then inserts SQLite rows
 * (IDs preserved). Requires DB_CONNECTION_STRING (or split DB_* vars) in .env.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import sqlite3 from "sqlite3";
import { DataSource } from "typeorm";

import {
  buildMssqlDataSourceOptions,
  DEFAULT_MSSQL_CONNECTION_STRING,
} from "../src/persistence/typeorm.config";

const SQLITE_PATH = path.join(__dirname, "..", "server-threadly.sqlite");

/** Parent → child insert order (bestReplyId applied after replies). */
const TABLE_ORDER = [
  "users",
  "categories",
  "page_seo",
  "threads",
  "replies",
  "attachments",
  "reply_attachments",
  "reply_likes",
  "reply_reactions",
  "thread_likes",
  "thread_views",
] as const;

type TableName = (typeof TABLE_ORDER)[number];

/** SQLite column → MSSQL column when names differ. */
const COLUMN_MAP: Partial<Record<TableName, Record<string, string>>> = {
  categories: { order: "sortOrder" },
};

const BIT_COLUMNS = new Set(["isActive", "noindex"]);

function loadDotEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function openSqlite(dbPath: string): sqlite3.Database {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
}

function sqliteAll<T = Record<string, unknown>>(
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
  });
}

function toJsDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // SQLite sometimes stores unix seconds
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeRow(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[table] ?? {};
  const out: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(row)) {
    const col = map[key] ?? key;
    if (BIT_COLUMNS.has(col)) {
      out[col] = raw === true || raw === 1 || raw === "1" ? 1 : 0;
      continue;
    }
    if (
      col.endsWith("At") ||
      col === "createdAt" ||
      col === "updatedAt" ||
      col === "approvedAt" ||
      col === "rejectedAt"
    ) {
      out[col] = toJsDate(raw);
      continue;
    }
    // Keep JSON text columns as strings (TypeORM simple-json stores text)
    out[col] = raw;
  }

  return out;
}

async function clearMssql(ds: DataSource) {
  // Disable FK checks, wipe, re-enable
  await ds.query(`
    EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
  `);
  const deleteOrder = [...TABLE_ORDER].reverse();
  for (const table of deleteOrder) {
    await ds.query(`DELETE FROM [${table}]`);
    console.log(`  cleared ${table}`);
  }
  await ds.query(`
    EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
  `);
}

function dedupeRows(table: TableName, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (table === "reply_reactions") {
    // Unique (replyId, userId, emoji) — SQLite may contain historical duplicates
    const best = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const key = `${row.replyId}|${row.userId}|${row.emoji}`;
      const prev = best.get(key);
      if (!prev) {
        best.set(key, row);
        continue;
      }
      const prevAt = prev.createdAt instanceof Date ? prev.createdAt.getTime() : 0;
      const nextAt = row.createdAt instanceof Date ? (row.createdAt as Date).getTime() : 0;
      if (nextAt < prevAt) best.set(key, row);
    }
    const out = [...best.values()];
    if (out.length !== rows.length) {
      console.log(`  reply_reactions: deduped ${rows.length} → ${out.length}`);
    }
    return out;
  }

  if (table === "reply_likes" || table === "thread_likes") {
    const colA = table === "reply_likes" ? "replyId" : "threadId";
    const best = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const key = `${row[colA]}|${row.userId}`;
      if (!best.has(key)) best.set(key, row);
    }
    const out = [...best.values()];
    if (out.length !== rows.length) {
      console.log(`  ${table}: deduped ${rows.length} → ${out.length}`);
    }
    return out;
  }

  return rows;
}

async function insertRows(ds: DataSource, table: TableName, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return;
  }

  const columns = Object.keys(rows[0]!);
  const colSql = columns.map((c) => `[${c}]`).join(", ");

  // Batch insert to avoid huge parameter lists
  const batchSize = 40;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const valuesSql: string[] = [];
    const params: unknown[] = [];
    let p = 0;

    for (const row of batch) {
      const placeholders: string[] = [];
      for (const col of columns) {
        placeholders.push(`@${p}`);
        params.push(row[col] ?? null);
        p += 1;
      }
      valuesSql.push(`(${placeholders.join(", ")})`);
    }

    await ds.query(`INSERT INTO [${table}] (${colSql}) VALUES ${valuesSql.join(", ")}`, params);
    inserted += batch.length;
  }

  console.log(`  ${table}: inserted ${inserted}`);
}

async function main() {
  loadDotEnv();

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`SQLite file not found: ${SQLITE_PATH}`);
    process.exit(1);
  }

  if (!process.env.DB_CONNECTION_STRING && !process.env.DB_HOST) {
    process.env.DB_CONNECTION_STRING = DEFAULT_MSSQL_CONNECTION_STRING;
  }

  console.log(`Source: ${SQLITE_PATH}`);
  const sqlite = openSqlite(SQLITE_PATH);

  const mssql = new DataSource(
    buildMssqlDataSourceOptions(
      { get: (key) => process.env[key] },
      {
        synchronize: false,
        connectionTimeout: 60000,
        requestTimeout: 120000,
        options: {
          encrypt: true,
          trustServerCertificate: true,
          connectTimeout: 60000,
        },
      } as any,
    ),
  );

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mssql.initialize();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`SQL Server connect attempt ${attempt}/5 failed; retrying in ${attempt * 3}s...`);
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
  if (lastErr) throw lastErr;
  console.log("Connected to SQL Server");

  try {
    console.log("\nClearing SQL Server tables...");
    await clearMssql(mssql);

    console.log("\nImporting...");
    const bestReplyByThread = new Map<string, string | null>();

    for (const table of TABLE_ORDER) {
      const rawRows = await sqliteAll<Record<string, unknown>>(sqlite, `SELECT * FROM "${table}"`);
      const rows = rawRows.map((r) => normalizeRow(table, r));

      if (table === "threads") {
        for (const row of rows) {
          const id = String(row.id);
          const best = row.bestReplyId == null || row.bestReplyId === "" ? null : String(row.bestReplyId);
          bestReplyByThread.set(id, best);
          row.bestReplyId = null; // set after replies exist
        }
      }

      // Only insert columns that exist on MSSQL target
      if (rows.length) {
        const mssqlCols: Array<{ COLUMN_NAME: string }> = await mssql.query(
          `
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @0
          `,
          [table],
        );
        const allowed = new Set(mssqlCols.map((c) => c.COLUMN_NAME));
        const filtered = dedupeRows(
          table,
          rows.map((row) => {
            const next: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(row)) {
              if (allowed.has(k)) next[k] = v;
            }
            return next;
          }),
        );

        // SQL Server unique index on emoji can mis-fire during bulk Unicode inserts;
        // drop, load, dedupe, recreate for reply_reactions.
        if (table === "reply_reactions") {
          await mssql.query(`
            IF EXISTS (
              SELECT 1 FROM sys.key_constraints
              WHERE name = 'UQ_b9529185a1b87145a5d86677fc5'
            )
            ALTER TABLE [reply_reactions] DROP CONSTRAINT [UQ_b9529185a1b87145a5d86677fc5];
          `);
          // Legacy SQL_Latin1_General_CP1_CI_AS treats most emoji as equal.
          await mssql.query(`
            ALTER TABLE [reply_reactions] ALTER COLUMN [emoji]
              nvarchar(32) COLLATE Latin1_General_100_CI_AS_SC NOT NULL;
          `);
        }

        await insertRows(mssql, table, filtered);

        if (table === "reply_reactions") {
          await mssql.query(`
            WITH d AS (
              SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY replyId, userId, emoji COLLATE Latin1_General_100_BIN2
                  ORDER BY createdAt ASC, id ASC
                ) AS rn
              FROM reply_reactions
            )
            DELETE FROM reply_reactions WHERE id IN (SELECT id FROM d WHERE rn > 1);
          `);
          await mssql.query(`
            IF NOT EXISTS (
              SELECT 1 FROM sys.key_constraints
              WHERE name = 'UQ_b9529185a1b87145a5d86677fc5'
            )
            ALTER TABLE [reply_reactions]
              ADD CONSTRAINT [UQ_b9529185a1b87145a5d86677fc5]
              UNIQUE ([replyId], [userId], [emoji]);
          `);
        }
      } else {
        console.log(`  ${table}: 0 rows`);
      }
    }

    // Restore bestReplyId now that replies exist
    let bestUpdated = 0;
    for (const [threadId, bestReplyId] of bestReplyByThread) {
      if (!bestReplyId) continue;
      await mssql.query(`UPDATE [threads] SET [bestReplyId] = @0 WHERE [id] = @1`, [
        bestReplyId,
        threadId,
      ]);
      bestUpdated += 1;
    }
    console.log(`  threads.bestReplyId restored: ${bestUpdated}`);

    console.log("\nVerification (SQL Server counts):");
    for (const table of TABLE_ORDER) {
      const [{ n }] = await mssql.query(`SELECT COUNT(*) AS n FROM [${table}]`);
      console.log(`  ${table}: ${n}`);
    }

    console.log("\nDone.");
  } finally {
    sqlite.close();
    await mssql.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
