import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../db.js";
import type {
  Member,
  MemberStatus,
} from "@workflow-app/shared";
import { ulid } from "ulid";

export interface CreateMemberData {
  name: string;
  email?: string;
  role: string;
  status: MemberStatus;
}

export const memberRepo = {
  async create(data: CreateMemberData): Promise<Member> {
    const now = new Date().toISOString();
    const id = ulid();
    const member: Member = {
      id,
      name: data.name,
      email: data.email || "",
      role: data.role,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `MEMBER#${id}`,
          SK: `MEMBER#${id}`,
          GSI1PK: `MEMBER`,
          GSI1SK: data.name,
          ...member,
          _type: "Member",
        },
      })
    );
    return member;
  },

  async getById(id: string): Promise<Member | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `MEMBER#${id}`, SK: `MEMBER#${id}` },
      })
    );
    if (!result.Item) return null;
    return extractMember(result.Item);
  },

  async list(): Promise<Member[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `MEMBER` },
      })
    );
    return (result.Items || []).filter((i) => i._type === "Member").map(extractMember);
  },

  async update(
    id: string,
    data: Partial<CreateMemberData>
  ): Promise<Member | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Member = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `MEMBER#${id}`,
          SK: `MEMBER#${id}`,
          GSI1PK: `MEMBER`,
          GSI1SK: updated.name,
          ...updated,
          _type: "Member",
        },
      })
    );
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `MEMBER#${id}`, SK: `MEMBER#${id}` },
      })
    );
    return true;
  },
};

function extractMember(item: Record<string, any>): Member {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
