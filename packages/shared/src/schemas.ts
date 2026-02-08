import { z } from "zod";

// ========== Enums ==========

export const StepType = z.enum(["task", "approval", "auto"]);
export type StepType = z.infer<typeof StepType>;

export const WorkflowStatus = z.enum([
  "draft",
  "in_progress",
  "pending_approval",
  "completed",
  "cancelled",
]);
export type WorkflowStatus = z.infer<typeof WorkflowStatus>;

export const TaskStatus = z.enum(["todo", "in_progress", "review", "done"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const ApprovalStatus = z.enum(["pending", "approved", "rejected"]);
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;

// ========== WorkflowTemplate ==========

export const WorkflowStepSchema = z.object({
  order: z.number().int().min(1),
  name: z.string().min(1).max(100),
  type: StepType,
  approverRoles: z.array(z.string()).default([]),
});
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowTemplateSchema = z.object({
  id: z.string().ulid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  steps: z.array(WorkflowStepSchema).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  steps: z.array(WorkflowStepSchema).min(1),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  steps: z.array(WorkflowStepSchema).min(1).optional(),
});
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

// ========== TaskPattern ==========

export const TaskPatternSchema = z.object({
  id: z.string().ulid(),
  templateId: z.string().ulid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  stepOrder: z.number().int().min(1),
  defaultAssigneeRole: z.string().optional(),
  priority: TaskPriority.default("medium"),
});
export type TaskPattern = z.infer<typeof TaskPatternSchema>;

export const CreateTaskPatternSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  stepOrder: z.number().int().min(1),
  defaultAssigneeRole: z.string().optional(),
  priority: TaskPriority.default("medium"),
});
export type CreateTaskPatternInput = z.infer<typeof CreateTaskPatternSchema>;

// ========== WorkflowInstance ==========

export const WorkflowInstanceSchema = z.object({
  id: z.string().ulid(),
  templateId: z.string().ulid(),
  templateName: z.string(),
  name: z.string().min(1).max(200),
  status: WorkflowStatus,
  currentStepOrder: z.number().int().min(1),
  createdBy: z.string(),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;

export const CreateWorkflowSchema = z.object({
  templateId: z.string().ulid(),
  name: z.string().min(1).max(200),
  createdBy: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;

// ========== Task ==========

export const TaskSchema = z.object({
  id: z.string().ulid(),
  workflowId: z.string().ulid(),
  patternId: z.string().ulid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  status: TaskStatus,
  priority: TaskPriority,
  assignee: z.string().optional(),
  stepOrder: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  priority: TaskPriority.default("medium"),
  assignee: z.string().optional(),
  stepOrder: z.number().int().min(1),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: TaskPriority.optional(),
  assignee: z.string().nullable().optional(),
  status: TaskStatus.optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ========== ApprovalStep ==========

export const ApprovalStepSchema = z.object({
  id: z.string().ulid(),
  workflowId: z.string().ulid(),
  stepOrder: z.number().int().min(1),
  stepName: z.string(),
  status: ApprovalStatus,
  requestedBy: z.string(),
  approver: z.string().optional(),
  comment: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ApprovalStep = z.infer<typeof ApprovalStepSchema>;

// ========== Member ==========

export const MemberStatus = z.enum(["active", "inactive"]);
export type MemberStatus = z.infer<typeof MemberStatus>;

export const MemberSchema = z.object({
  id: z.string().ulid(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1).max(100),
  status: MemberStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Member = z.infer<typeof MemberSchema>;

export const CreateMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1).max(100),
  status: MemberStatus.default("active"),
});
export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;

export const UpdateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1).max(100).optional(),
  status: MemberStatus.optional(),
});
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

// ========== Role ==========

export const RolePermissionsSchema = z.object({
  member: z.boolean().default(false),
  lead: z.boolean().default(false),
  requester: z.boolean().default(false),
  approver: z.boolean().default(false),
  admin: z.boolean().default(false),
});
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;

export const RoleSchema = z.object({
  id: z.string().ulid(),
  name: z.string().min(1).max(100),
  permissions: RolePermissionsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: RolePermissionsSchema,
});
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: RolePermissionsSchema.partial().optional(),
});
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

// ========== API Response ==========

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(
  dataSchema: T
) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    nextToken: z.string().optional(),
  });
