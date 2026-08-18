import type { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import type { DataSourceOptions } from "typeorm";

import { UserEntity } from "./entities/user.entity";
import { ThreadEntity } from "./entities/thread.entity";
import { ReplyEntity } from "./entities/reply.entity";
import { ReplyLikeEntity } from "./entities/reply-like.entity";
import { ReplyReactionEntity } from "./entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "./entities/reply-attachment.entity";
import { AttachmentEntity } from "./entities/attachment.entity";
import { CategoryEntity } from "./entities/category.entity";
import { ThreadLikeEntity } from "./entities/thread-like.entity";
import { ThreadViewEntity } from "./entities/thread-view.entity";
import { PageSeoEntity } from "./entities/page-seo.entity";

export const APP_ENTITIES = [
  UserEntity,
  ThreadEntity,
  ReplyEntity,
  ReplyLikeEntity,
  ReplyReactionEntity,
  ReplyAttachmentEntity,
  AttachmentEntity,
  CategoryEntity,
  ThreadLikeEntity,
  ThreadViewEntity,
  PageSeoEntity,
] as const;

export type ParsedMssqlConnection = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  trustServerCertificate: boolean;
  encrypt: boolean;
};

/** Default Fater SQL Server connection (override with DB_CONNECTION_STRING). */
export const DEFAULT_MSSQL_CONNECTION_STRING =
  "Password=Fater1324@#!;User ID=admin;Initial Catalog=threadly-fater;Data Source=31.7.70.12,1433;TrustServerCertificate=True";

/**
 * Parses ADO.NET-style connection strings, e.g.
 * Password=...;User ID=...;Initial Catalog=...;Data Source=host,1433;TrustServerCertificate=True
 */
export function parseMssqlConnectionString(raw: string): ParsedMssqlConnection {
  const map = new Map<string, string>();
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }

  const dataSource = map.get("data source") ?? map.get("server") ?? "localhost";
  const [hostPart, portPart] = dataSource.split(",");
  const host = (hostPart ?? "localhost").trim();
  const port = Number((portPart ?? "1433").trim()) || 1433;

  const username = map.get("user id") ?? map.get("uid") ?? map.get("user") ?? "sa";
  const password = map.get("password") ?? map.get("pwd") ?? "";
  const database = map.get("initial catalog") ?? map.get("database") ?? "threadly";

  const trustRaw = (map.get("trustservercertificate") ?? "true").toLowerCase();
  const encryptRaw = (map.get("encrypt") ?? "true").toLowerCase();

  return {
    host,
    port,
    username,
    password,
    database,
    trustServerCertificate: trustRaw === "true" || trustRaw === "yes" || trustRaw === "1",
    encrypt: encryptRaw !== "false" && encryptRaw !== "no" && encryptRaw !== "0",
  };
}

export function resolveMssqlConnection(env: {
  get: (key: string) => string | undefined;
}): ParsedMssqlConnection {
  const connectionString = env.get("DB_CONNECTION_STRING")?.trim();
  if (connectionString) return parseMssqlConnectionString(connectionString);

  if (env.get("DB_HOST") || env.get("DB_NAME") || env.get("DB_USER")) {
    return {
      host: env.get("DB_HOST") ?? "localhost",
      port: Number(env.get("DB_PORT") ?? "1433") || 1433,
      username: env.get("DB_USER") ?? "sa",
      password: env.get("DB_PASSWORD") ?? "",
      database: env.get("DB_NAME") ?? "threadly",
      trustServerCertificate: (env.get("DB_TRUST_SERVER_CERTIFICATE") ?? "true").toLowerCase() !== "false",
      encrypt: (env.get("DB_ENCRYPT") ?? "true").toLowerCase() !== "false",
    };
  }

  // Project default (انجمن فاطر) — override with DB_CONNECTION_STRING for your own server.
  return parseMssqlConnectionString(DEFAULT_MSSQL_CONNECTION_STRING);
}

export function buildMssqlDataSourceOptions(
  env: { get: (key: string) => string | undefined },
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  const conn = resolveMssqlConnection(env);
  const syncRaw = (env.get("TYPEORM_SYNC") ?? "true").toLowerCase();
  const synchronize = syncRaw === "true" || syncRaw === "1" || syncRaw === "yes";

  return {
    type: "mssql",
    host: conn.host,
    port: conn.port,
    username: conn.username,
    password: conn.password,
    database: conn.database,
    entities: [...APP_ENTITIES],
    synchronize,
    logging: (env.get("TYPEORM_LOGGING") ?? "false").toLowerCase() === "true",
    options: {
      encrypt: conn.encrypt,
      trustServerCertificate: conn.trustServerCertificate,
    },
    // Avoid TDS driver request timeout on cold starts / sync
    requestTimeout: Number(env.get("DB_REQUEST_TIMEOUT_MS") ?? "60000") || 60000,
    connectionTimeout: Number(env.get("DB_CONNECTION_TIMEOUT_MS") ?? "30000") || 30000,
    ...overrides,
  } as DataSourceOptions;
}

export function buildTypeOrmModuleOptions(config: ConfigService): TypeOrmModuleOptions {
  return buildMssqlDataSourceOptions({
    get: (key) => config.get<string>(key),
  }) as TypeOrmModuleOptions;
}
