import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("catalog")
  listCatalog() {
    return this.catalog.listPublicCatalog();
  }

  @Patch("admin/catalog/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCatalog(
    @Param("id") id: string,
    @Body() body: { creditCost?: number; enabled?: boolean; description?: string },
  ) {
    return this.catalog.updateCatalogItem(id, body);
  }
}
