import { Module } from "@nestjs/common";
import { AgentsModule } from "./agents/agents.module";
import { AuthModule } from "./auth/auth.module";
import { AuthSupportModule } from "./auth/auth-support.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CreditsModule } from "./credits/credits.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { IntelligenceModule } from "./intelligence/intelligence.module";
import { RunsModule } from "./runs/runs.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    DatabaseModule,
    AuthSupportModule,
    UsersModule,
    CreditsModule,
    AuthModule,
    AgentsModule,
    CatalogModule,
    RunsModule,
    HealthModule,
    IntelligenceModule,
  ],
})
export class AppModule {}
