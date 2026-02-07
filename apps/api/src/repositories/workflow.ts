import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type {
  WorkflowInstance,
  WorkflowStatus,
} from "@workflow-app/shared";
import { ulid } from "ulid";

export interface CreateWorkflowData {
  templateId: string;
  templateName: string;
  name: string;
  status: WorkflowStatus;
  currentStepOrder: number;
  createdBy: string;
  dueDate?: string;
}

export const workflowRepo = {
  async create(data: CreateWorkflowData): Promise<WorkflowInstance> {
    const now = new Date().toISOString();
    const id = ulid();
    const workflow: WorkflowInstance = {
      id,
      templateId: data.templateId,
      templateName: data.templateName,
      name: data.name,
      status: data.status,
      currentStepOrder: data.currentStepOrder,
      createdBy: data.createdBy,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${id}`,
          SK: `WF#${id}`,
          GSI1PK: `TMPL#${data.templateId}`,
          GSI1SK: `WF#${now}`,
          GSI2PK: `WF_STATUS#${data.status}`,
          GSI2SK: now,
          ...workflow,
          _type: "Workflow",
        },
      })
    );
    return workflow;
  },

  async getById(id: string): Promise<WorkflowInstance | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `WF#${id}`, SK: `WF#${id}` },
      })
    );
    if (!result.Item) return null;
    return extractWorkflow(result.Item);
  },

  async list(status?: WorkflowStatus): Promise<WorkflowInstance[]> {
    if (status) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :pk",
          ExpressionAttributeValues: { ":pk": `WF_STATUS#${status}` },
          ScanIndexForward: false,
        })
      );
      return (result.Items || []).filter((i) => i._type === "Workflow").map(extractWorkflow);
    }

    // List all workflows - query by each status
    const statuses: WorkflowStatus[] = [
      "draft",
      "in_progress",
      "pending_approval",
      "completed",
      "cancelled",
    ];
    const results = await Promise.all(
      statuses.map((s) =>
        docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI2",
            KeyConditionExpression: "GSI2PK = :pk",
            ExpressionAttributeValues: { ":pk": `WF_STATUS#${s}` },
            ScanIndexForward: false,
          })
        )
      )
    );
    return results
      .flatMap((r) => r.Items || [])
      .filter((i) => i._type === "Workflow")
      .map(extractWorkflow)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async updateStatus(
    id: string,
    status: WorkflowStatus,
    currentStepOrder?: number
  ): Promise<WorkflowInstance | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: WorkflowInstance = {
      ...existing,
      status,
      currentStepOrder: currentStepOrder ?? existing.currentStepOrder,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${id}`,
          SK: `WF#${id}`,
          GSI1PK: `TMPL#${existing.templateId}`,
          GSI1SK: `WF#${existing.createdAt}`,
          GSI2PK: `WF_STATUS#${status}`,
          GSI2SK: now,
          ...updated,
          _type: "Workflow",
        },
      })
    );
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `WF#${id}`, SK: `WF#${id}` },
      })
    );
    return true;
  },
};

function extractWorkflow(item: Record<string, any>): WorkflowInstance {
  return {
    id: item.id,
    templateId: item.templateId,
    templateName: item.templateName,
    name: item.name,
    status: item.status,
    currentStepOrder: item.currentStepOrder,
    createdBy: item.createdBy,
    dueDate: item.dueDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
