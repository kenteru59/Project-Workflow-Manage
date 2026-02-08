import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  CreateRoleSchema,
  UpdateRoleSchema,
} from "@workflow-app/shared";
import { roleRepo } from "../repositories/role.js";

export const roleRoutes = new Hono()
  .get("/", async (c) => {
    const roles = await roleRepo.list();
    return c.json({ success: true, data: roles });
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const role = await roleRepo.getById(id);
    if (!role) {
      return c.json({ success: false, error: "Role not found" }, 404);
    }
    return c.json({ success: true, data: role });
  })
  .post("/", zValidator("json", CreateRoleSchema), async (c) => {
    const data = c.req.valid("json");
    const role = await roleRepo.create(data);
    return c.json({ success: true, data: role }, 201);
  })
  .patch("/:id", zValidator("json", UpdateRoleSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const role = await roleRepo.update(id, data);
    if (!role) {
      return c.json({ success: false, error: "Role not found" }, 404);
    }
    return c.json({ success: true, data: role });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await roleRepo.delete(id);
    return c.json({ success: true });
  });
