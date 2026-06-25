import { Module } from "@nestjs/common";
import { DerivativesController } from "./derivatives.controller";
import { DerivativesService } from "./derivatives.service";

@Module({ controllers: [DerivativesController], providers: [DerivativesService] })
export class DerivativesModule {}
