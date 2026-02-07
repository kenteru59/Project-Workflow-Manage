import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type {
  WorkflowTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TaskPattern,
  CreateTaskPatternInput,
} from "@workflow-app/shared";
import { ulid } from "ulid";

export const templateRepo = {
  async create(input: CreateTemplateInput): Promise<WorkflowTemplate> {
    const now = new Date().toISOString();
    const id = ulid();
    const template: WorkflowTemplate = {
      id,
      name: input.name,
      description: input.description || "",
      steps: input.steps,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TMPL#${id}`,
          SK: `TMPL#${id}`,
          GSI1PK: "TMPL",
          GSI1SK: now,
          ...template,
          _type: "Template",
        },
      })
    );
    return template;
  },

  async getById(id: string): Promise<WorkflowTemplate | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `TMPL#${id}`, SK: `TMPL#${id}` },
      })
    );
    if (!result.Item) return null;
    return extractTemplate(result.Item);
  },

  async list(): Promise<WorkflowTemplate[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "TMPL" },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []).map(extractTemplate);
  },

  async update(
    id: string,
    input: UpdateTemplateInput
  ): Promise<WorkflowTemplate | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: WorkflowTemplate = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      steps: input.steps ?? existing.steps,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TMPL#${id}`,
          SK: `TMPL#${id}`,
          GSI1PK: "TMPL",
          GSI1SK: existing.createdAt,
          ...updated,
          _type: "Template",
        },
      })
    );
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    // Delete all task patterns first
    const patterns = await this.getTaskPatterns(id);
    for (const p of patterns) {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { PK: `TMPL#${id}`, SK: `TPAT#${p.id}` },
        })
      );
    }
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `TMPL#${id}`, SK: `TMPL#${id}` },
      })
    );
    return true;
  },

  // ===== TaskPattern =====

  async createTaskPattern(
    templateId: string,
    input: CreateTaskPatternInput
  ): Promise<TaskPattern> {
    const id = ulid();
    const pattern: TaskPattern = {
      id,
      templateId,
      name: input.name,
      description: input.description || "",
      stepOrder: input.stepOrder,
      defaultAssigneeRole: input.defaultAssigneeRole,
      priority: input.priority || "medium",
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TMPL#${templateId}`,
          SK: `TPAT#${id}`,
          ...pattern,
          _type: "TaskPattern",
        },
      })
    );
    return pattern;
  },

  async getTaskPatterns(templateId: string): Promise<TaskPattern[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `TMPL#${templateId}`,
          ":sk": "TPAT#",
        },
      })
    );
    return (result.Items || []).map(extractTaskPattern);
  },

  async deleteTaskPattern(
    templateId: string,
    patternId: string
  ): Promise<boolean> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `TMPL#${templateId}`, SK: `TPAT#${patternId}` },
      })
    );
    return true;
  },
};

function extractTemplate(item: Record<string, any>): WorkflowTemplate {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    steps: item.steps || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function extractTaskPattern(item: Record<string, any>): TaskPattern {
  return {
    id: item.id,
    templateId: item.templateId,
    name: item.name,
    description: item.description || "",
    stepOrder: item.stepOrder,
    defaultAssigneeRole: item.defaultAssigneeRole,
    priority: item.priority || "medium",
  };
}
