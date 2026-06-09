import { Global, Module } from "@nestjs/common";
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
export class DatabaseModule {}
