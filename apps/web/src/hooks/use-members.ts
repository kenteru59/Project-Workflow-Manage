import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi } from "@/lib/api";
import type { Member, CreateMemberInput, UpdateMemberInput } from "@workflow-app/shared";

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () => memberApi.list(),
  });
}

export function useMember(id: string) {
  return useQuery<Member>({
    queryKey: ["members", id],
    queryFn: () => memberApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberInput) => memberApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberInput }) =>
      memberApi.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      if (data?.id) {
        qc.invalidateQueries({ queryKey: ["members", data.id] });
      }
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memberApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
