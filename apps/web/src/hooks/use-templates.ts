import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templateApi } from "@/lib/api";
import type {
  WorkflowTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TaskPattern,
  CreateTaskPatternInput,
} from "@workflow-app/shared";

export function useTemplates() {
  return useQuery<WorkflowTemplate[]>({
    queryKey: ["templates"],
    queryFn: templateApi.list,
  });
}

export function useTemplate(id: string) {
  return useQuery<WorkflowTemplate>({
    queryKey: ["templates", id],
    queryFn: () => templateApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) => templateApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTemplateInput;
    }) => templateApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["templates", id] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// Task patterns
export function useTaskPatterns(templateId: string) {
  return useQuery<TaskPattern[]>({
    queryKey: ["templates", templateId, "patterns"],
    queryFn: () => templateApi.getPatterns(templateId),
    enabled: !!templateId,
  });
}

export function useCreateTaskPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: CreateTaskPatternInput;
    }) => templateApi.createPattern(templateId, data),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({
        queryKey: ["templates", templateId, "patterns"],
      });
    },
  });
}

export function useDeleteTaskPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      patternId,
    }: {
      templateId: string;
      patternId: string;
    }) => templateApi.deletePattern(templateId, patternId),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({
        queryKey: ["templates", templateId, "patterns"],
      });
    },
  });
}
