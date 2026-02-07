import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth.js";
import { templateRoutes } from "./routes/templates.js";
import { workflowRoutes } from "./routes/workflows.js";
import { taskRoutes } from "./routes/tasks.js";
import { approvalRoutes } from "./routes/approvals.js";

const app = new Hono().basePath("/api");

// Middleware
app.use("*", cors());
app.use("*", logger());
app.use("*", authMiddleware);

// Routes
app.route("/templates", templateRoutes);
app.route("/workflows", workflowRoutes);
app.route("/tasks", taskRoutes);
app.route("/approvals", approvalRoutes);

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ success: false, error: err.message, stack: err.stack }, 500);
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
export type AppType = typeof app;
