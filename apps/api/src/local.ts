import { serve } from "@hono/node-server";

const port = Number(process.env.PORT) || 3001;

// Set DynamoDB endpoint for local development
process.env.DYNAMODB_ENDPOINT =
  process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

console.log("Starting server with DYNAMODB_ENDPOINT:", process.env.DYNAMODB_ENDPOINT);

// Use dynamic import to ensure environment variables are set before db.ts is loaded
const { default: app } = await import("./app.js");

console.log(`API server starting on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
