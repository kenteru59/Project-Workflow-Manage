import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { UpdateTaskSchema, TaskStatus } from "@workflow-app/shared";
import { taskRepo } from "../repositories/task.js";
import { workflowService } from "../services/workflow.js";

export const taskRoutes = new Hono()
  .get("/", async (c) => {
    const status = c.req.query("status") as
      | z.infer<typeof TaskStatus>
      | undefined;
    const assignee = c.req.query("assignee");
    const workflowId = c.req.query("workflowId");

    if (workflowId) {
      const tasks = await taskRepo.listByWorkflow(workflowId);
      return c.json({ success: true, data: tasks });
    }
    if (assignee) {
      const tasks = await taskRepo.listByAssignee(assignee);
      return c.json({ success: true, data: tasks });
    }
    if (status) {
      const tasks = await taskRepo.listByStatus(status);
      return c.json({ success: true, data: tasks });
    }
    const tasks = await taskRepo.listAll();
    return c.json({ success: true, data: tasks });
  })
  .patch("/:id", zValidator("json", UpdateTaskSchema), async (c) => {
    const taskId = c.req.param("id");
    const input = c.req.valid("json");

    // Find the task first
    const task = await taskRepo.findById(taskId);
    if (!task) {
      return c.json({ success: false, error: "タスクが見つかりません" }, 404);
    }

    const updated = await taskRepo.update(task.workflowId, taskId, input);
    return c.json({ success: true, data: updated });
  })
  .patch(
    "/:id/status",
    zValidator("json", z.object({ status: TaskStatus })),
    async (c) => {
      const taskId = c.req.param("id");
      const { status } = c.req.valid("json");

      const task = await taskRepo.findById(taskId);
      if (!task) {
        return c.json(
          { success: false, error: "タスクが見つかりません" },
          404
        );
      }

      const updated = await taskRepo.updateStatus(
        task.workflowId,
        taskId,
        status
      );

      // If task is done, try to advance workflow
      if (status === "done") {
        await workflowService.advanceWorkflow(task.workflowId);
      }

      return c.json({ success: true, data: updated });
    }
  );
