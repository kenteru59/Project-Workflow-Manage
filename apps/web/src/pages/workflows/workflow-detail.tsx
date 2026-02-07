import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useWorkflow, useUpdateWorkflowStatus } from "@/hooks/use-workflows";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workflow, isLoading } = useWorkflow(id || "");
  const updateStatusMut = useUpdateWorkflowStatus();

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        ワークフローが見つかりません
      </div>
    );
  }

  const tasks = workflow.tasks || [];
  const approvals = workflow.approvals || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/workflows")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <StatusBadge type="workflow" value={workflow.status} />
          </div>
          <p className="text-muted-foreground">
            {workflow.templateName} ・ 作成者: {workflow.createdBy} ・
            現在のステップ: {workflow.currentStepOrder}
          </p>
        </div>
        {workflow.status !== "completed" &&
          workflow.status !== "cancelled" && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() =>
                updateStatusMut.mutate({
                  id: workflow.id,
                  status: "cancelled",
                })
              }
            >
              <XCircle className="mr-1 h-4 w-4" />
              キャンセル
            </Button>
          )}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>タイムライン</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              作成日: {new Date(workflow.createdAt).toLocaleString("ja-JP")}
            </div>
            {workflow.dueDate && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                期限: {new Date(workflow.dueDate).toLocaleDateString("ja-JP")}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              最終更新:{" "}
              {new Date(workflow.updatedAt).toLocaleString("ja-JP")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>タスク ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              タスクはありません
            </p>
          ) : (
            <div className="space-y-2">
              {tasks
                .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
                .map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        S{task.stepOrder}
                      </span>
                      <StatusBadge type="priority" value={task.priority} />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.assignee || "未割当"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge type="task" value={task.status} />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>承認ステップ ({approvals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              承認ステップはありません
            </p>
          ) : (
            <div className="space-y-2">
              {approvals
                .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
                .map((appr: any) => (
                  <div
                    key={appr.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        S{appr.stepOrder}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{appr.stepName}</p>
                        <p className="text-xs text-muted-foreground">
                          申請者: {appr.requestedBy}
                          {appr.approver && ` ・ 承認者: ${appr.approver}`}
                        </p>
                        {appr.comment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            コメント: {appr.comment}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge type="approval" value={appr.status} />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
