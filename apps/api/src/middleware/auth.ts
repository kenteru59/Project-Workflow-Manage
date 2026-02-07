import { createMiddleware } from "hono/factory";

// Phase 1-5: Mock authentication
// Phase 6: Replace with AWS Cognito JWT verification

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  // Mock user - read from header or default
  const userId = c.req.header("X-User-Id") || "user-001";
  const userName = c.req.header("X-User-Name") || "田中太郎";
  const userEmail =
    c.req.header("X-User-Email") || "tanaka@example.com";
  const userRole = c.req.header("X-User-Role") || "manager";

  c.set("user", {
    id: userId,
    name: userName,
    email: userEmail,
    role: userRole,
  });

  await next();
});
