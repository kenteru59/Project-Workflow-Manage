import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const workflowStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "下書き", className: "bg-gray-400 text-white" },
  in_progress: {
    label: "進行中",
    className: "bg-blue-500 text-white",
  },
  pending_approval: {
    label: "承認待ち",
    className: "bg-purple-500 text-white",
  },
  completed: { label: "完了", className: "bg-green-500 text-white" },
  cancelled: {
    label: "キャンセル",
    className: "bg-red-500 text-white",
  },
};

const taskStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  todo: { label: "未着手", className: "bg-slate-400 text-white" },
  in_progress: {
    label: "進行中",
    className: "bg-blue-500 text-white",
  },
  review: { label: "レビュー", className: "bg-amber-500 text-white" },
  done: { label: "完了", className: "bg-green-500 text-white" },
};

const approvalStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "承認待ち", className: "bg-amber-500 text-white" },
  approved: { label: "承認済", className: "bg-green-500 text-white" },
  rejected: { label: "却下", className: "bg-red-500 text-white" },
};

const priorityConfig: Record<
  string,
  { label: string; className: string }
> = {
  low: { label: "低", className: "bg-slate-400 text-white" },
  medium: { label: "中", className: "bg-blue-500 text-white" },
  high: { label: "高", className: "bg-amber-500 text-white" },
  urgent: { label: "緊急", className: "bg-red-500 text-white" },
};

interface StatusBadgeProps {
  type: "workflow" | "task" | "approval" | "priority";
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const configs = {
    workflow: workflowStatusConfig,
    task: taskStatusConfig,
    approval: approvalStatusConfig,
    priority: priorityConfig,
  };
  const config = configs[type][value];
  if (!config) return <Badge variant="outline">{value}</Badge>;
  return (
    <Badge className={cn("border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
