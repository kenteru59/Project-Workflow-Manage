import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from "@workflow-app/shared";
import { ulid } from "ulid";

export interface CreateTaskData extends CreateTaskInput {
  workflowId: string;
  patternId?: string;
}

export const taskRepo = {
  async create(data: CreateTaskData): Promise<Task> {
    const now = new Date().toISOString();
    const id = ulid();
    const task: Task = {
      id,
      workflowId: data.workflowId,
      patternId: data.patternId,
      title: data.title,
      description: data.description || "",
      status: "todo",
      priority: data.priority || "medium",
      assignee: data.assignee,
      stepOrder: data.stepOrder,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${data.workflowId}`,
          SK: `TASK#${id}`,
          GSI1PK: data.assignee
            ? `TASK_ASSIGNEE#${data.assignee}`
            : "TASK_ASSIGNEE#unassigned",
          GSI1SK: now,
          GSI2PK: `TASK_STATUS#todo`,
          GSI2SK: now,
          ...task,
          _type: "Task",
        },
      })
    );
    return task;
  },

  async getById(workflowId: string, taskId: string): Promise<Task | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `WF#${workflowId}`, SK: `TASK#${taskId}` },
      })
    );
    if (!result.Item) return null;
    return extractTask(result.Item);
  },

  async findById(taskId: string): Promise<Task | null> {
    // Search by status GSIs since we don't know workflowId
    const statuses: TaskStatus[] = [
      "todo",
      "in_progress",
      "review",
      "done",
    ];
    for (const status of statuses) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :pk",
          FilterExpression: "id = :id",
          ExpressionAttributeValues: {
            ":pk": `TASK_STATUS#${status}`,
            ":id": taskId,
          },
        })
      );
      if (result.Items && result.Items.length > 0) {
        return extractTask(result.Items[0]);
      }
    }
    return null;
  },

  async listByWorkflow(workflowId: string): Promise<Task[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `WF#${workflowId}`,
          ":sk": "TASK#",
        },
      })
    );
    return (result.Items || []).map(extractTask);
  },

  async listByStatus(status: TaskStatus): Promise<Task[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: { ":pk": `TASK_STATUS#${status}` },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []).filter((i) => i._type === "Task").map(extractTask);
  },

  async listByAssignee(assignee: string): Promise<Task[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `TASK_ASSIGNEE#${assignee}`,
        },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []).filter((i) => i._type === "Task").map(extractTask);
  },

  async listAll(): Promise<Task[]> {
    const statuses: TaskStatus[] = [
      "todo",
      "in_progress",
      "review",
      "done",
    ];
    const results = await Promise.all(
      statuses.map((s) =>
        docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI2",
            KeyConditionExpression: "GSI2PK = :pk",
            ExpressionAttributeValues: { ":pk": `TASK_STATUS#${s}` },
            ScanIndexForward: false,
          })
        )
      )
    );
    return results
      .flatMap((r) => r.Items || [])
      .filter((i) => i._type === "Task")
      .map(extractTask)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async update(
    workflowId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<Task | null> {
    const existing = await this.getById(workflowId, taskId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const assignee =
      input.assignee === null
        ? undefined
        : input.assignee ?? existing.assignee;
    const updated: Task = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      priority: input.priority ?? existing.priority,
      assignee,
      status: input.status ?? existing.status,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `WF#${workflowId}`,
          SK: `TASK#${taskId}`,
          GSI1PK: assignee
            ? `TASK_ASSIGNEE#${assignee}`
            : "TASK_ASSIGNEE#unassigned",
          GSI1SK: now,
          GSI2PK: `TASK_STATUS#${updated.status}`,
          GSI2SK: now,
          ...updated,
          _type: "Task",
        },
      })
    );
    return updated;
  },

  async updateStatus(
    workflowId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<Task | null> {
    return this.update(workflowId, taskId, { status });
  },
};

function extractTask(item: Record<string, any>): Task {
  return {
    id: item.id,
    workflowId: item.workflowId,
    patternId: item.patternId,
    title: item.title,
    description: item.description || "",
    status: item.status,
    priority: item.priority || "medium",
    assignee: item.assignee,
    stepOrder: item.stepOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
