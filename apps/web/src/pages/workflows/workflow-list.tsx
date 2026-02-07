import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { useWorkflows, useDeleteWorkflow } from "@/hooks/use-workflows";
import { Plus, Trash2, GitBranch } from "lucide-react";
import type { WorkflowStatus } from "@workflow-app/shared";

export function WorkflowListPage() {
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">(
    "all"
  );
  const { data: workflows = [], isLoading } = useWorkflows(
    statusFilter === "all" ? undefined : statusFilter
  );
  const deleteMut = useDeleteWorkflow();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ワークフロー</h1>
          <p className="text-muted-foreground">ワークフローインスタンスの管理</p>
        </div>
        <Button asChild>
          <Link to="/workflows/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">ステータス:</label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="draft">下書き</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="pending_approval">承認待ち</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
            <SelectItem value="cancelled">キャンセル</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              ワークフローがありません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <Card key={wf.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/workflows/${wf.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge type="workflow" value={wf.status} />
                      <div>
                        <p className="font-medium">{wf.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {wf.templateName} ・ 作成者: {wf.createdBy} ・
                          ステップ {wf.currentStepOrder}
                          {wf.dueDate && (
                            <>
                              {" "}
                              ・ 期限:{" "}
                              {new Date(wf.dueDate).toLocaleDateString("ja-JP")}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (confirm("このワークフローを削除しますか？")) {
                        deleteMut.mutate(wf.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
