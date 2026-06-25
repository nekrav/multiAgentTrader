import { Module } from "@nestjs/common";
import { IntelligenceController } from "./intelligence.controller";
import { FxstreetRssService } from "./fxstreet-rss.service";
import { IntelligenceService } from "./intelligence.service";

@Module({
  controllers: [IntelligenceController],
  providers: [FxstreetRssService, IntelligenceService],
})
export class IntelligenceModule {}
