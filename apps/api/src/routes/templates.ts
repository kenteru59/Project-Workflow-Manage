import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  CreateTaskPatternSchema,
} from "@workflow-app/shared";
import { templateRepo } from "../repositories/template.js";

export const templateRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const templates = await templateRepo.list();
      return c.json({ success: true, data: templates });
    } catch (e: any) {
      console.error(e);
      return c.json({ success: false, error: e.message, stack: e.stack }, 500);
    }
  })
  .post("/", zValidator("json", CreateTemplateSchema), async (c) => {
    const input = c.req.valid("json");
    const template = await templateRepo.create(input);
    return c.json({ success: true, data: template }, 201);
  })
  .get("/:id", async (c) => {
    const template = await templateRepo.getById(c.req.param("id"));
    if (!template) {
      return c.json({ success: false, error: "テンプレートが見つかりません" }, 404);
    }
    return c.json({ success: true, data: template });
  })
  .put("/:id", zValidator("json", UpdateTemplateSchema), async (c) => {
    const input = c.req.valid("json");
    const template = await templateRepo.update(c.req.param("id"), input);
    if (!template) {
      return c.json({ success: false, error: "テンプレートが見つかりません" }, 404);
    }
    return c.json({ success: true, data: template });
  })
  .delete("/:id", async (c) => {
    await templateRepo.delete(c.req.param("id"));
    return c.json({ success: true });
  })
  // Task patterns
  .get("/:id/patterns", async (c) => {
    const patterns = await templateRepo.getTaskPatterns(c.req.param("id"));
    return c.json({ success: true, data: patterns });
  })
  .post(
    "/:id/patterns",
    zValidator("json", CreateTaskPatternSchema),
    async (c) => {
      const input = c.req.valid("json");
      const pattern = await templateRepo.createTaskPattern(
        c.req.param("id"),
        input
      );
      return c.json({ success: true, data: pattern }, 201);
    }
  )
  .delete("/:templateId/patterns/:patternId", async (c) => {
    await templateRepo.deleteTaskPattern(
      c.req.param("templateId"),
      c.req.param("patternId")
    );
    return c.json({ success: true });
  });
