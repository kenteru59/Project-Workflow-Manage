import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type {
  Role,
  RolePermissions,
  CreateRoleInput,
  UpdateRoleInput,
} from "@workflow-app/shared";
import { ulid } from "ulid";

export const roleRepo = {
  async create(input: CreateRoleInput): Promise<Role> {
    const now = new Date().toISOString();
    const id = ulid();
    const role: Role = {
      id,
      name: input.name,
      permissions: input.permissions,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ROLE#${id}`,
          SK: `ROLE#${id}`,
          GSI1PK: `ROLE`,
          GSI1SK: input.name,
          ...role,
          _type: "Role",
        },
      })
    );
    return role;
  },

  async getById(id: string): Promise<Role | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `ROLE#${id}`, SK: `ROLE#${id}` },
      })
    );
    if (!result.Item) return null;
    return extractRole(result.Item);
  },

  async list(): Promise<Role[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `ROLE` },
      })
    );
    return (result.Items || []).filter((i) => i._type === "Role").map(extractRole);
  },

  async update(
    id: string,
    data: UpdateRoleInput
  ): Promise<Role | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Role = {
      ...existing,
      name: data.name ?? existing.name,
      permissions: {
        ...existing.permissions,
        ...(data.permissions || {}),
      },
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ROLE#${id}`,
          SK: `ROLE#${id}`,
          GSI1PK: `ROLE`,
          GSI1SK: updated.name,
          ...updated,
          _type: "Role",
        },
      })
    );
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `ROLE#${id}`, SK: `ROLE#${id}` },
      })
    );
    return true;
  },
};

function extractRole(item: Record<string, any>): Role {
  return {
    id: item.id,
    name: item.name,
    permissions: item.permissions,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
