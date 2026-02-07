import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalApi } from "@/lib/api";
import type { ApprovalStep } from "@workflow-app/shared";

export function usePendingApprovals() {
  return useQuery<ApprovalStep[]>({
    queryKey: ["approvals", "pending"],
    queryFn: approvalApi.list,
  });
}

export function useApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.approve(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.reject(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
