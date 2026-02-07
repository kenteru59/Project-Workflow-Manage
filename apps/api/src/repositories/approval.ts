import {
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type { ApprovalStep, ApprovalStatus } from "@workflow-app/shared";
import { ulid } from "ulid";

export interface CreateApprovalData {
  workflowId: string;
  stepOrder: number;
  stepName: string;
  requestedBy: string;
}

export const approvalRepo = {
  async create(data: CreateApprovalData): Promise<ApprovalStep> {
    const now = new Date().toISOString();
    const id = ulid();
    const approval: ApprovalStep = {
      id,
      workflowId: data.workflowId,
      stepOrder: data.stepOrder,
      stepName: data.stepName,
      status: "pending",
      requestedBy: data.requestedBy,
      createdAt: now,
      updatedAt: now,
    };
    const orderStr = String(data.stepOrder).padStart(3, "0");
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${data.workflowId}`,
          SK: `APPR#${orderStr}#${id}`,
          GSI1PK: "APPR_APPROVER#unassigned",
          GSI1SK: now,
          GSI2PK: `APPR_STATUS#pending`,
          GSI2SK: now,
          ...approval,
          _type: "Approval",
        },
      })
    );
    return approval;
  },

  async getById(
    workflowId: string,
    approvalId: string
  ): Promise<{ approval: ApprovalStep; sk: string } | null> {
    // Need to find the approval - query by workflow and filter
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `WF#${workflowId}`,
          ":sk": "APPR#",
        },
      })
    );
    const item = (result.Items || []).find((i) => i.id === approvalId);
    if (!item) return null;
    return { approval: extractApproval(item), sk: item.SK };
  },

  async findById(
    approvalId: string
  ): Promise<{ approval: ApprovalStep; sk: string } | null> {
    // Search across statuses
    const statuses: ApprovalStatus[] = ["pending", "approved", "rejected"];
    for (const status of statuses) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :pk",
          ExpressionAttributeValues: { ":pk": `APPR_STATUS#${status}` },
        })
      );
      const item = (result.Items || []).find(
        (i) => i.id === approvalId && i._type === "Approval"
      );
      if (item) {
        return { approval: extractApproval(item), sk: item.SK };
      }
    }
    return null;
  },

  async listByWorkflow(workflowId: string): Promise<ApprovalStep[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `WF#${workflowId}`,
          ":sk": "APPR#",
        },
      })
    );
    return (result.Items || []).map(extractApproval);
  },

  async listPending(): Promise<ApprovalStep[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: { ":pk": "APPR_STATUS#pending" },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []).filter((i) => i._type === "Approval").map(extractApproval);
  },

  async approve(
    workflowId: string,
    approvalId: string,
    approver: string,
    comment?: string
  ): Promise<ApprovalStep | null> {
    return this.updateStatus(
      workflowId,
      approvalId,
      "approved",
      approver,
      comment
    );
  },

  async reject(
    workflowId: string,
    approvalId: string,
    approver: string,
    comment?: string
  ): Promise<ApprovalStep | null> {
    return this.updateStatus(
      workflowId,
      approvalId,
      "rejected",
      approver,
      comment
    );
  },

  async updateStatus(
    workflowId: string,
    approvalId: string,
    status: ApprovalStatus,
    approver: string,
    comment?: string
  ): Promise<ApprovalStep | null> {
    const found = await this.getById(workflowId, approvalId);
    if (!found) return null;

    const { approval, sk } = found;
    const now = new Date().toISOString();
    const updated: ApprovalStep = {
      ...approval,
      status,
      approver,
      comment,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${workflowId}`,
          SK: sk,
          GSI1PK: `APPR_APPROVER#${approver}`,
          GSI1SK: now,
          GSI2PK: `APPR_STATUS#${status}`,
          GSI2SK: now,
          ...updated,
          _type: "Approval",
        },
      })
    );
    return updated;
  },
};

function extractApproval(item: Record<string, any>): ApprovalStep {
  return {
    id: item.id,
    workflowId: item.workflowId,
    stepOrder: item.stepOrder,
    stepName: item.stepName,
    status: item.status,
    requestedBy: item.requestedBy,
    approver: item.approver,
    comment: item.comment,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
