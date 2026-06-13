import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AgentsModule } from "../agents/agents.module";
import { CatalogModule } from "../catalog/catalog.module";
import { CreditsModule } from "../credits/credits.module";
import { redisConnectionOptions } from "./redis-connection";
import { RunsController } from "./runs.controller";
import { RunsProcessor } from "./runs.processor";
import { RunsService } from "./runs.service";

@Module({
  imports: [
    BullModule.forRoot({
      connection: redisConnectionOptions(),
    }),
    BullModule.registerQueue({ name: "agent-runs" }),
    AgentsModule,
    CatalogModule,
    CreditsModule,
  ],
  controllers: [RunsController],
  providers: [RunsService, RunsProcessor],
})
export class RunsModule {}
