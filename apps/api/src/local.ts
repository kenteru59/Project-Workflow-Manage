import { serve } from "@hono/node-server";
import app from "./app.js";

const port = Number(process.env.PORT) || 3001;

// Set DynamoDB endpoint for local development
process.env.DYNAMODB_ENDPOINT =
  process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

console.log(`API server starting on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
