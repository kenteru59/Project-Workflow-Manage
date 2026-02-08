const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "リクエストに失敗しました" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Templates =====
export const templateApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/templates").then(
      (r) => r.data
    ),
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/templates/${id}`).then(
      (r) => r.data
    ),
  create: (data: any) =>
    request<{ success: boolean; data: any }>("/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  delete: (id: string) =>
    request<{ success: boolean }>(`/templates/${id}`, {
      method: "DELETE",
    }),
  // Task patterns
  getPatterns: (templateId: string) =>
    request<{ success: boolean; data: any[] }>(
      `/templates/${templateId}/patterns`
    ).then((r) => r.data),
  createPattern: (templateId: string, data: any) =>
    request<{ success: boolean; data: any }>(
      `/templates/${templateId}/patterns`,
      { method: "POST", body: JSON.stringify(data) }
    ).then((r) => r.data),
  deletePattern: (templateId: string, patternId: string) =>
    request<{ success: boolean }>(
      `/templates/${templateId}/patterns/${patternId}`,
      { method: "DELETE" }
    ),
};

// ===== Workflows =====
export const workflowApi = {
  list: (status?: string) =>
    request<{ success: boolean; data: any[] }>(
      `/workflows${status ? `?status=${status}` : ""}`
    ).then((r) => r.data),
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/workflows/${id}`).then(
      (r) => r.data
    ),
  create: (data: any) =>
    request<{ success: boolean; data: any }>("/workflows", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  delete: (id: string) =>
    request<{ success: boolean }>(`/workflows/${id}`, {
      method: "DELETE",
    }),
  updateStatus: (id: string, status: string) =>
    request<{ success: boolean; data: any }>(`/workflows/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then((r) => r.data),
  createTask: (workflowId: string, data: any) =>
    request<{ success: boolean; data: any }>(
      `/workflows/${workflowId}/tasks`,
      { method: "POST", body: JSON.stringify(data) }
    ).then((r) => r.data),
};

// ===== Tasks =====
export const taskApi = {
  list: (params?: { status?: string; assignee?: string; workflowId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.assignee) searchParams.set("assignee", params.assignee);
    if (params?.workflowId) searchParams.set("workflowId", params.workflowId);
    const qs = searchParams.toString();
    return request<{ success: boolean; data: any[] }>(
      `/tasks${qs ? `?${qs}` : ""}`
    ).then((r) => r.data);
  },
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    request<{ success: boolean; data: any }>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then((r) => r.data),
};

// ===== Approvals =====
export const approvalApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/approvals").then(
      (r) => r.data
    ),
  approve: (id: string, comment?: string) =>
    request<{ success: boolean; data: any }>(`/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }).then((r) => r.data),
  reject: (id: string, comment?: string) =>
    request<{ success: boolean; data: any }>(`/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }).then((r) => r.data),
};

// ===== Members =====
export const memberApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/members").then((r) => r.data),
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/members/${id}`).then((r) => r.data),
  create: (data: any) =>
    request<{ success: boolean; data: any }>("/members", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  delete: (id: string) =>
    request<{ success: boolean }>(`/members/${id}`, {
      method: "DELETE",
    }),
};

// ===== Roles =====
export const roleApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/roles").then((r) => r.data),
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/roles/${id}`).then((r) => r.data),
  create: (data: any) =>
    request<{ success: boolean; data: any }>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.data),
  delete: (id: string) =>
    request<{ success: boolean }>(`/roles/${id}`, {
      method: "DELETE",
    }),
};
