import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/lib/api";
import type { Role, CreateRoleInput, UpdateRoleInput } from "@workflow-app/shared";

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => roleApi.list(),
  });
}

export function useRole(id: string) {
  return useQuery<Role>({
    queryKey: ["roles", id],
    queryFn: () => roleApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => roleApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      roleApi.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      if (data?.id) {
        qc.invalidateQueries({ queryKey: ["roles", data.id] });
      }
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
