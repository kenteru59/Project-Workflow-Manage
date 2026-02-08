import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  CreateMemberSchema,
  UpdateMemberSchema,
} from "@workflow-app/shared";
import { memberRepo } from "../repositories/member.js";

export const memberRoutes = new Hono()
  .get("/", async (c) => {
    const members = await memberRepo.list();
    return c.json({ success: true, data: members });
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const member = await memberRepo.getById(id);
    if (!member) {
      return c.json({ success: false, error: "Member not found" }, 404);
    }
    return c.json({ success: true, data: member });
  })
  .post("/", zValidator("json", CreateMemberSchema), async (c) => {
    const data = c.req.valid("json");
    const member = await memberRepo.create(data);
    return c.json({ success: true, data: member }, 201);
  })
  .patch("/:id", zValidator("json", UpdateMemberSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const member = await memberRepo.update(id, data);
    if (!member) {
      return c.json({ success: false, error: "Member not found" }, 404);
    }
    return c.json({ success: true, data: member });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await memberRepo.delete(id);
    return c.json({ success: true });
  });
