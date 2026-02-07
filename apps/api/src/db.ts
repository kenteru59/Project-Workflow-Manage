import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = process.env.DYNAMODB_ENDPOINT !== undefined;

console.log("DynamoDB Config:", {
  isLocal,
  endpoint: process.env.DYNAMODB_ENDPOINT,
  region: process.env.AWS_REGION || "ap-northeast-1",
});

const client = new DynamoDBClient(
  isLocal
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
        region: "ap-northeast-1",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {
        region: process.env.AWS_REGION || "ap-northeast-1",
      }
);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.TABLE_NAME || "WorkflowApp";
