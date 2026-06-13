import { Global, Inject, Module, OnModuleInit } from "@nestjs/common";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Redis from "ioredis";
import { Pool } from "pg";

export const POSTGRES_POOL = Symbol("POSTGRES_POOL");
export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      useFactory: () =>
        new Pool({
          connectionString:
            process.env.DATABASE_URL ??
            "postgres://aitraders:aitraders_dev_password@localhost:5432/aitraders",
        }),
    },
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
        client.on("error", () => undefined);
        return client;
      },
    },
  ],
  exports: [POSTGRES_POOL, REDIS_CLIENT],
})
export class DatabaseModule implements OnModuleInit {
  constructor(@Inject(POSTGRES_POOL) private readonly postgres: Pool) {}

  async onModuleInit() {
    const migrationsDir = [resolve(process.cwd(), "infra/migrations"), resolve(process.cwd(), "../../infra/migrations")].find((dir) =>
      existsSync(dir),
    );
    if (!migrationsDir) {
      return;
    }

    await this.postgres.query(
      "create table if not exists schema_migrations (filename text primary key, applied_at timestamptz not null default now())",
    );

    for (const filename of readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort()) {
      const applied = await this.postgres.query("select 1 from schema_migrations where filename = $1", [filename]);
      if (applied.rowCount) {
        continue;
      }

      const sql = readFileSync(resolve(migrationsDir, filename), "utf8");
      const client = await this.postgres.connect();
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations(filename) values ($1)", [filename]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }
  }
}
