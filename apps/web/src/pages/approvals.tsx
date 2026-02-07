import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  usePendingApprovals,
  useApprove,
  useReject,
} from "@/hooks/use-approvals";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import type { ApprovalStep } from "@workflow-app/shared";

export function ApprovalsPage() {
  const { data: approvals = [], isLoading } = usePendingApprovals();
  const approveMut = useApprove();
  const rejectMut = useReject();

  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalStep | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");

  const handleAction = async () => {
    if (!selectedApproval) return;
    if (action === "approve") {
      await approveMut.mutateAsync({
        id: selectedApproval.id,
        comment: comment || undefined,
      });
    } else {
      await rejectMut.mutateAsync({
        id: selectedApproval.id,
        comment: comment || undefined,
      });
    }
    setSelectedApproval(null);
    setComment("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">承認キュー</h1>
        <p className="text-muted-foreground">
          承認待ちのリクエスト一覧
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              承認待ちのリクエストはありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((appr) => (
            <Card key={appr.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge type="approval" value={appr.status} />
                    <div>
                      <p className="font-medium">{appr.stepName}</p>
                      <p className="text-sm text-muted-foreground">
                        申請者: {appr.requestedBy} ・ ステップ{" "}
                        {appr.stepOrder}
                      </p>
                      <Link
                        to={`/workflows/${appr.workflowId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        ワークフロー詳細を表示
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedApproval(appr);
                        setAction("approve");
                        setComment("");
                      }}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedApproval(appr);
                        setAction("reject");
                        setComment("");
                      }}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      却下
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval/Reject dialog */}
      <Dialog
        open={!!selectedApproval}
        onOpenChange={(open) => !open && setSelectedApproval(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "承認確認" : "却下確認"}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval?.stepName} を
              {action === "approve" ? "承認" : "却下"}します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                コメント（任意）
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメントを入力..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedApproval(null)}
            >
              キャンセル
            </Button>
            <Button
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
              variant={action === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={approveMut.isPending || rejectMut.isPending}
            >
              {action === "approve" ? "承認" : "却下"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
