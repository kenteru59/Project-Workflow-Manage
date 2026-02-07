import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { approvalRepo } from "../repositories/approval.js";
import { workflowService } from "../services/workflow.js";

const ApprovalActionSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const approvalRoutes = new Hono()
  .get("/", async (c) => {
    const approvals = await approvalRepo.listPending();
    return c.json({ success: true, data: approvals });
  })
  .post(
    "/:id/approve",
    zValidator("json", ApprovalActionSchema),
    async (c) => {
      const approvalId = c.req.param("id");
      const { comment } = c.req.valid("json");
      const user = c.get("user");

      const found = await approvalRepo.findById(approvalId);
      if (!found) {
        return c.json(
          { success: false, error: "承認ステップが見つかりません" },
          404
        );
      }

      const updated = await approvalRepo.approve(
        found.approval.workflowId,
        approvalId,
        user.id,
        comment
      );

      // Try to advance workflow
      if (updated) {
        await workflowService.advanceWorkflow(found.approval.workflowId);
      }

      return c.json({ success: true, data: updated });
    }
  )
  .post(
    "/:id/reject",
    zValidator("json", ApprovalActionSchema),
    async (c) => {
      const approvalId = c.req.param("id");
      const { comment } = c.req.valid("json");
      const user = c.get("user");

      const found = await approvalRepo.findById(approvalId);
      if (!found) {
        return c.json(
          { success: false, error: "承認ステップが見つかりません" },
          404
        );
      }

      const updated = await approvalRepo.reject(
        found.approval.workflowId,
        approvalId,
        user.id,
        comment
      );

      return c.json({ success: true, data: updated });
    }
  );
