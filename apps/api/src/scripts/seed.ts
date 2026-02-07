import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    endpoint,
    region: "ap-northeast-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
  { marshallOptions: { removeUndefinedValues: true } }
);

const TABLE_NAME = process.env.TABLE_NAME || "WorkflowApp";

async function put(item: Record<string, any>) {
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

async function seed() {
  const now = new Date().toISOString();

  // ===== テンプレート1: 休暇申請 =====
  const tmpl1Id = ulid();
  const tmpl1Steps = [
    { order: 1, name: "申請", type: "task" as const },
    { order: 2, name: "上長承認", type: "approval" as const, approverRole: "manager" },
    { order: 3, name: "人事確認", type: "approval" as const, approverRole: "hr" },
    { order: 4, name: "完了", type: "auto" as const },
  ];
  await put({
    PK: `TMPL#${tmpl1Id}`,
    SK: `TMPL#${tmpl1Id}`,
    GSI1PK: "TMPL",
    GSI1SK: now,
    _type: "Template",
    id: tmpl1Id,
    name: "休暇申請",
    description: "有給休暇・特別休暇の申請ワークフロー",
    steps: tmpl1Steps,
    createdAt: now,
    updatedAt: now,
  });

  // Task patterns for 休暇申請
  const tp1aId = ulid();
  await put({
    PK: `TMPL#${tmpl1Id}`,
    SK: `TPAT#${tp1aId}`,
    _type: "TaskPattern",
    id: tp1aId,
    templateId: tmpl1Id,
    name: "申請書作成",
    description: "休暇申請書に必要事項を記入する",
    stepOrder: 1,
    defaultAssigneeRole: "applicant",
    priority: "medium",
  });

  const tp1bId = ulid();
  await put({
    PK: `TMPL#${tmpl1Id}`,
    SK: `TPAT#${tp1bId}`,
    _type: "TaskPattern",
    id: tp1bId,
    templateId: tmpl1Id,
    name: "引き継ぎ資料準備",
    description: "休暇中の業務引き継ぎ資料を作成する",
    stepOrder: 1,
    defaultAssigneeRole: "applicant",
    priority: "high",
  });

  // ===== テンプレート2: 購買申請 =====
  const tmpl2Id = ulid();
  const tmpl2Steps = [
    { order: 1, name: "見積作成", type: "task" as const },
    { order: 2, name: "上長承認", type: "approval" as const, approverRole: "manager" },
    { order: 3, name: "経理承認", type: "approval" as const, approverRole: "accounting" },
    { order: 4, name: "発注", type: "task" as const },
    { order: 5, name: "完了", type: "auto" as const },
  ];
  await put({
    PK: `TMPL#${tmpl2Id}`,
    SK: `TMPL#${tmpl2Id}`,
    GSI1PK: "TMPL",
    GSI1SK: new Date(Date.now() + 1000).toISOString(),
    _type: "Template",
    id: tmpl2Id,
    name: "購買申請",
    description: "備品・サービスの購買申請ワークフロー",
    steps: tmpl2Steps,
    createdAt: new Date(Date.now() + 1000).toISOString(),
    updatedAt: new Date(Date.now() + 1000).toISOString(),
  });

  const tp2aId = ulid();
  await put({
    PK: `TMPL#${tmpl2Id}`,
    SK: `TPAT#${tp2aId}`,
    _type: "TaskPattern",
    id: tp2aId,
    templateId: tmpl2Id,
    name: "見積書取得",
    description: "ベンダーから見積書を取得する",
    stepOrder: 1,
    defaultAssigneeRole: "requester",
    priority: "high",
  });

  const tp2bId = ulid();
  await put({
    PK: `TMPL#${tmpl2Id}`,
    SK: `TPAT#${tp2bId}`,
    _type: "TaskPattern",
    id: tp2bId,
    templateId: tmpl2Id,
    name: "比較表作成",
    description: "複数ベンダーの見積比較表を作成する",
    stepOrder: 1,
    defaultAssigneeRole: "requester",
    priority: "medium",
  });

  const tp2cId = ulid();
  await put({
    PK: `TMPL#${tmpl2Id}`,
    SK: `TPAT#${tp2cId}`,
    _type: "TaskPattern",
    id: tp2cId,
    templateId: tmpl2Id,
    name: "発注処理",
    description: "承認後の発注処理を実施する",
    stepOrder: 4,
    defaultAssigneeRole: "purchaser",
    priority: "high",
  });

  // ===== テンプレート3: バグ修正 =====
  const tmpl3Id = ulid();
  const tmpl3Steps = [
    { order: 1, name: "報告", type: "task" as const },
    { order: 2, name: "トリアージ", type: "task" as const },
    { order: 3, name: "修正", type: "task" as const },
    { order: 4, name: "レビュー", type: "approval" as const, approverRole: "tech_lead" },
    { order: 5, name: "テスト", type: "task" as const },
    { order: 6, name: "完了", type: "auto" as const },
  ];
  await put({
    PK: `TMPL#${tmpl3Id}`,
    SK: `TMPL#${tmpl3Id}`,
    GSI1PK: "TMPL",
    GSI1SK: new Date(Date.now() + 2000).toISOString(),
    _type: "Template",
    id: tmpl3Id,
    name: "バグ修正",
    description: "バグ報告から修正完了までのワークフロー",
    steps: tmpl3Steps,
    createdAt: new Date(Date.now() + 2000).toISOString(),
    updatedAt: new Date(Date.now() + 2000).toISOString(),
  });

  const tp3aId = ulid();
  await put({
    PK: `TMPL#${tmpl3Id}`,
    SK: `TPAT#${tp3aId}`,
    _type: "TaskPattern",
    id: tp3aId,
    templateId: tmpl3Id,
    name: "バグレポート作成",
    description: "再現手順、期待動作、実際の動作を記録する",
    stepOrder: 1,
    defaultAssigneeRole: "reporter",
    priority: "high",
  });

  const tp3bId = ulid();
  await put({
    PK: `TMPL#${tmpl3Id}`,
    SK: `TPAT#${tp3bId}`,
    _type: "TaskPattern",
    id: tp3bId,
    templateId: tmpl3Id,
    name: "優先度判定",
    description: "影響範囲を調査し優先度を判定する",
    stepOrder: 2,
    defaultAssigneeRole: "tech_lead",
    priority: "high",
  });

  const tp3cId = ulid();
  await put({
    PK: `TMPL#${tmpl3Id}`,
    SK: `TPAT#${tp3cId}`,
    _type: "TaskPattern",
    id: tp3cId,
    templateId: tmpl3Id,
    name: "修正実装",
    description: "バグの修正を実装する",
    stepOrder: 3,
    defaultAssigneeRole: "developer",
    priority: "high",
  });

  const tp3dId = ulid();
  await put({
    PK: `TMPL#${tmpl3Id}`,
    SK: `TPAT#${tp3dId}`,
    _type: "TaskPattern",
    id: tp3dId,
    templateId: tmpl3Id,
    name: "テスト実施",
    description: "修正内容のテストを実施する",
    stepOrder: 5,
    defaultAssigneeRole: "qa",
    priority: "high",
  });

  console.log("シードデータの投入が完了しました");
  console.log(`  テンプレート1: 休暇申請 (${tmpl1Id})`);
  console.log(`  テンプレート2: 購買申請 (${tmpl2Id})`);
  console.log(`  テンプレート3: バグ修正 (${tmpl3Id})`);
}

seed().catch(console.error);
