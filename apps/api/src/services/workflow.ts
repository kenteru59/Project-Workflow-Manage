import { templateRepo } from "../repositories/template.js";
import { workflowRepo } from "../repositories/workflow.js";
import { taskRepo } from "../repositories/task.js";
import { approvalRepo } from "../repositories/approval.js";
import type { WorkflowInstance, Task, ApprovalStep } from "@workflow-app/shared";

export const workflowService = {
  async createFromTemplate(
    templateId: string,
    name: string,
    createdBy: string,
    dueDate?: string
  ): Promise<{
    workflow: WorkflowInstance;
    tasks: Task[];
    approvals: ApprovalStep[];
  }> {
    const template = await templateRepo.getById(templateId);
    if (!template) {
      throw new Error("テンプレートが見つかりません");
    }

    // Create workflow instance
    const workflow = await workflowRepo.create({
      templateId,
      templateName: template.name,
      name,
      status: "in_progress",
      currentStepOrder: 1,
      createdBy,
      dueDate,
    });

    // Create tasks from task patterns
    const patterns = await templateRepo.getTaskPatterns(templateId);
    const tasks: Task[] = [];
    for (const pattern of patterns) {
      const task = await taskRepo.create({
        workflowId: workflow.id,
        patternId: pattern.id,
        title: pattern.name,
        description: pattern.description,
        priority: pattern.priority,
        assignee: pattern.defaultAssigneeRole,
        stepOrder: pattern.stepOrder,
      });
      tasks.push(task);
    }

    // Create approval steps for approval-type steps
    const approvals: ApprovalStep[] = [];
    for (const step of template.steps) {
      if (step.type === "approval") {
        const approval = await approvalRepo.create({
          workflowId: workflow.id,
          stepOrder: step.order,
          stepName: step.name,
          requestedBy: createdBy,
        });
        approvals.push(approval);
      }
    }

    return { workflow, tasks, approvals };
  },

  async advanceWorkflow(
    workflowId: string
  ): Promise<WorkflowInstance | null> {
    const workflow = await workflowRepo.getById(workflowId);
    if (!workflow) return null;

    // Get template to know all steps
    const template = await templateRepo.getById(workflow.templateId);
    if (!template) return null;

    const currentStep = workflow.currentStepOrder;
    const maxStep = Math.max(...template.steps.map((s) => s.order));

    // Check if current step tasks are all done
    const tasks = await taskRepo.listByWorkflow(workflowId);
    const currentStepTasks = tasks.filter(
      (t) => t.stepOrder === currentStep
    );
    const allTasksDone =
      currentStepTasks.length === 0 ||
      currentStepTasks.every((t) => t.status === "done");

    // Check if current step approvals are all approved
    const approvals = await approvalRepo.listByWorkflow(workflowId);
    const currentStepApprovals = approvals.filter(
      (a) => a.stepOrder === currentStep
    );
    const allApprovalsApproved =
      currentStepApprovals.length === 0 ||
      currentStepApprovals.every((a) => a.status === "approved");

    if (!allTasksDone || !allApprovalsApproved) {
      return workflow;
    }

    // Move to next step or complete
    if (currentStep >= maxStep) {
      return workflowRepo.updateStatus(workflowId, "completed");
    }

    const nextStep = currentStep + 1;
    const nextStepDef = template.steps.find((s) => s.order === nextStep);

    let newStatus = workflow.status;
    if (nextStepDef?.type === "approval") {
      newStatus = "pending_approval";
    } else {
      newStatus = "in_progress";
    }

    return workflowRepo.updateStatus(workflowId, newStatus, nextStep);
  },
};
