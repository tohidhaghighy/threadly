/**
 * Convert remaining varchar/char/text/ntext columns to nvarchar.
 * Drops dependent indexes + defaults, alters, then recreates them.
 *
 * Usage (from backend/):
 *   npm run db:fix-unicode
 *
 * Rows already stored as "????" cannot be recovered — re-enter or re-seed.
 */
import { DataSource } from "typeorm";

import {
  buildMssqlDataSourceOptions,
  DEFAULT_MSSQL_CONNECTION_STRING,
} from "../src/persistence/typeorm.config";

type ColRow = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  IS_NULLABLE: "YES" | "NO";
};

type IndexRow = {
  table_name: string;
  index_name: string;
  is_unique: boolean;
  is_primary_key: boolean;
  is_unique_constraint: boolean;
  type_desc: string;
  column_name: string;
  key_ordinal: number;
  is_included_column: boolean;
};

type DefaultRow = {
  table_name: string;
  column_name: string;
  default_name: string;
  definition: string;
};

function targetType(col: ColRow): string {
  if (col.DATA_TYPE === "text" || col.DATA_TYPE === "ntext") return "nvarchar(max)";
  if (col.CHARACTER_MAXIMUM_LENGTH === -1 || col.CHARACTER_MAXIMUM_LENGTH == null) {
    return "nvarchar(max)";
  }
  return `nvarchar(${col.CHARACTER_MAXIMUM_LENGTH})`;
}

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

  const cols: ColRow[] = await dataSource.query(`
    SELECT
      TABLE_NAME,
      COLUMN_NAME,
      DATA_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND DATA_TYPE IN ('varchar', 'char', 'text', 'ntext')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  if (!cols.length) {
    console.log("No varchar/char/text/ntext columns found — schema already Unicode-ready.");
    await dataSource.destroy();
    return;
  }

  console.log(`Found ${cols.length} column(s) to convert.\n`);

  for (const col of cols) {
    const table = col.TABLE_NAME;
    const column = col.COLUMN_NAME;
    const nullSql = col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    const typeSql = targetType(col);

    console.log(`→ ${table}.${column} (${col.DATA_TYPE} → ${typeSql})`);

    // 1) Drop defaults on this column
    const defaults: DefaultRow[] = await dataSource.query(
      `
      SELECT t.name AS table_name, c.name AS column_name, d.name AS default_name,
             d.definition AS definition
      FROM sys.default_constraints d
      JOIN sys.columns c ON c.default_object_id = d.object_id
      JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = @0 AND c.name = @1
      `,
      [table, column],
    );

    for (const d of defaults) {
      await dataSource.query(`ALTER TABLE [${table}] DROP CONSTRAINT [${d.default_name}]`);
      console.log(`  dropped default ${d.default_name}`);
    }

    // 2) Capture + drop indexes / unique constraints that reference this column
    const indexParts: IndexRow[] = await dataSource.query(
      `
      SELECT t.name AS table_name, i.name AS index_name, i.is_unique, i.is_primary_key,
             i.is_unique_constraint, i.type_desc,
             c.name AS column_name, ic.key_ordinal, ic.is_included_column
      FROM sys.tables t
      JOIN sys.indexes i ON i.object_id = t.object_id
      JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
      JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = ic.column_id
      WHERE t.name = @0
        AND i.name IS NOT NULL
        AND i.is_primary_key = 0
        AND i.name IN (
          SELECT i2.name
          FROM sys.indexes i2
          JOIN sys.index_columns ic2 ON ic2.object_id = i2.object_id AND ic2.index_id = i2.index_id
          JOIN sys.columns c2 ON c2.object_id = i2.object_id AND c2.column_id = ic2.column_id
          WHERE i2.object_id = t.object_id AND c2.name = @1
        )
      ORDER BY i.name, ic.is_included_column, ic.key_ordinal
      `,
      [table, column],
    );

    const indexNames = [...new Set(indexParts.map((r) => r.index_name))];
    const recreate: Array<{ sql: string; name: string }> = [];

    for (const name of indexNames) {
      const parts = indexParts.filter((r) => r.index_name === name);
      const keyCols = parts
        .filter((p) => !p.is_included_column)
        .sort((a, b) => a.key_ordinal - b.key_ordinal)
        .map((p) => `[${p.column_name}]`);
      const includeCols = parts
        .filter((p) => p.is_included_column)
        .map((p) => `[${p.column_name}]`);
      const isUniqueConstraint = Boolean(parts[0]?.is_unique_constraint);
      const unique = parts[0]?.is_unique ? "UNIQUE " : "";
      const includeSql = includeCols.length ? ` INCLUDE (${includeCols.join(", ")})` : "";

      if (isUniqueConstraint) {
        recreate.push({
          name,
          sql: `ALTER TABLE [${table}] ADD CONSTRAINT [${name}] UNIQUE (${keyCols.join(", ")})`,
        });
        await dataSource.query(`ALTER TABLE [${table}] DROP CONSTRAINT [${name}]`);
        console.log(`  dropped unique constraint ${name}`);
      } else {
        recreate.push({
          name,
          sql: `CREATE ${unique}INDEX [${name}] ON [${table}] (${keyCols.join(", ")})${includeSql}`,
        });
        await dataSource.query(`DROP INDEX [${name}] ON [${table}]`);
        console.log(`  dropped index ${name}`);
      }
    }

    // 3) Alter column
    await dataSource.query(
      `ALTER TABLE [${table}] ALTER COLUMN [${column}] ${typeSql} ${nullSql}`,
    );
    console.log(`  altered to ${typeSql}`);

    // 4) Recreate defaults
    for (const d of defaults) {
      await dataSource.query(
        `ALTER TABLE [${table}] ADD CONSTRAINT [${d.default_name}] DEFAULT ${d.definition} FOR [${column}]`,
      );
      console.log(`  restored default ${d.default_name}`);
    }

    // 5) Recreate indexes
    for (const idx of recreate) {
      await dataSource.query(idx.sql);
      console.log(`  restored index ${idx.name}`);
    }
  }

  const remaining: Array<{ TABLE_NAME: string; COLUMN_NAME: string; DATA_TYPE: string }> =
    await dataSource.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND DATA_TYPE IN ('varchar', 'char', 'text', 'ntext')
    `);

  console.log(
    remaining.length
      ? `\nStill non-Unicode: ${JSON.stringify(remaining)}`
      : "\nAll string columns are now nvarchar (Unicode).",
  );

  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
