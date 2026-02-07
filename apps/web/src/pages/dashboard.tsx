import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useTasks } from "@/hooks/use-tasks";
import { useWorkflows } from "@/hooks/use-workflows";
import { usePendingApprovals } from "@/hooks/use-approvals";
import {
  CheckCircle,
  ClipboardList,
  GitBranch,
  ArrowRight,
} from "lucide-react";

export function DashboardPage() {
  const { data: tasks = [] } = useTasks();
  const { data: workflows = [] } = useWorkflows();
  const { data: approvals = [] } = usePendingApprovals();

  const myTasks = tasks.filter((t) => t.status !== "done");
  const activeWorkflows = workflows.filter(
    (w) => w.status !== "completed" && w.status !== "cancelled"
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">
          ワークフローとタスクの概要
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              未完了タスク
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === "in_progress").length} 件が進行中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              進行中ワークフロー
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeWorkflows.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter((w) => w.status === "pending_approval").length}{" "}
              件が承認待ち
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              未承認リクエスト
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvals.length}</div>
            <Link
              to="/approvals"
              className="text-xs text-blue-600 hover:underline"
            >
              承認キューを確認
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>最近のタスク</CardTitle>
              <CardDescription>直近のタスク一覧</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/kanban">
                カンバンボードへ <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              未完了のタスクはありません
            </p>
          ) : (
            <div className="space-y-3">
              {myTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
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

      {/* Recent workflows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>最近のワークフロー</CardTitle>
              <CardDescription>直近のワークフロー一覧</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/workflows">
                一覧へ <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ワークフローはありません
            </p>
          ) : (
            <div className="space-y-3">
              {workflows.slice(0, 5).map((wf) => (
                <Link
                  key={wf.id}
                  to={`/workflows/${wf.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{wf.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wf.templateName} ・ {wf.createdBy}
                    </p>
                  </div>
                  <StatusBadge type="workflow" value={wf.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
