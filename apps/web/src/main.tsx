import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { DashboardPage } from "@/pages/dashboard";
import { TemplateListPage } from "@/pages/templates/template-list";
import { TemplateFormPage } from "@/pages/templates/template-form";
import { WorkflowListPage } from "@/pages/workflows/workflow-list";
import { WorkflowNewPage } from "@/pages/workflows/workflow-new";
import { WorkflowDetailPage } from "@/pages/workflows/workflow-detail";
import { KanbanPage } from "@/pages/kanban";
import { ApprovalsPage } from "@/pages/approvals";
import "./app.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/templates" element={<TemplateListPage />} />
            <Route path="/templates/new" element={<TemplateFormPage />} />
            <Route path="/templates/:id" element={<TemplateFormPage />} />
            <Route path="/workflows" element={<WorkflowListPage />} />
            <Route path="/workflows/new" element={<WorkflowNewPage />} />
            <Route
              path="/workflows/:id"
              element={<WorkflowDetailPage />}
            />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
