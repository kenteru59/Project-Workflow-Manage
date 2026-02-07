import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CreateWorkflowSchema, WorkflowStatus, CreateTaskSchema } from "@workflow-app/shared";
import { workflowRepo } from "../repositories/workflow.js";
import { taskRepo } from "../repositories/task.js";
import { approvalRepo } from "../repositories/approval.js";
import { workflowService } from "../services/workflow.js";

export const workflowRoutes = new Hono()
  .get("/", async (c) => {
    const status = c.req.query("status") as
      | z.infer<typeof WorkflowStatus>
      | undefined;
    const workflows = await workflowRepo.list(status);
    return c.json({ success: true, data: workflows });
  })
  .post("/", zValidator("json", CreateWorkflowSchema), async (c) => {
    const input = c.req.valid("json");
    const user = c.get("user");
    try {
      const result = await workflowService.createFromTemplate(
        input.templateId,
        input.name,
        input.createdBy || user.id,
        input.dueDate
      );
      return c.json({ success: true, data: result }, 201);
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 400);
    }
  })
  .get("/:id", async (c) => {
    const workflow = await workflowRepo.getById(c.req.param("id"));
    if (!workflow) {
      return c.json(
        { success: false, error: "ワークフローが見つかりません" },
        404
      );
    }
    const tasks = await taskRepo.listByWorkflow(workflow.id);
    const approvals = await approvalRepo.listByWorkflow(workflow.id);
    return c.json({
      success: true,
      data: { ...workflow, tasks, approvals },
    });
  })
  .delete("/:id", async (c) => {
    await workflowRepo.delete(c.req.param("id"));
    return c.json({ success: true });
  })
  .patch(
    "/:id/status",
    zValidator("json", z.object({ status: WorkflowStatus })),
    async (c) => {
      const { status } = c.req.valid("json");
      const workflow = await workflowRepo.updateStatus(
        c.req.param("id"),
        status
      );
      if (!workflow) {
        return c.json(
          { success: false, error: "ワークフローが見つかりません" },
          404
        );
      }
      return c.json({ success: true, data: workflow });
    }
  )
  // Tasks under workflow
  .post(
    "/:wfId/tasks",
    zValidator("json", CreateTaskSchema),
    async (c) => {
      const input = c.req.valid("json");
      const task = await taskRepo.create({
        workflowId: c.req.param("wfId"),
        ...input,
      });
      return c.json({ success: true, data: task }, 201);
    }
  );
