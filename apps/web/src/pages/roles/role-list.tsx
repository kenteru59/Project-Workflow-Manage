import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoles, useDeleteRole } from "@/hooks/use-roles";
import { Plus, Trash2, Edit, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PERMISSION_LABELS: Record<string, string> = {
  member: "メンバー",
  lead: "リード",
  requester: "申請者",
  approver: "承認者",
  admin: "管理者",
};

export function RoleListPage() {
  const { data: roles = [], isLoading } = useRoles();
  const deleteMut = useDeleteRole();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ロールマスタ</h1>
          <p className="text-muted-foreground">
            システム内の役割と権限の定義
          </p>
        </div>
        <Button asChild>
          <Link to="/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            ロール追加
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              ロールが登録されていません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">権限</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <Badge key={key} variant="secondary" className="font-normal">
                            {PERMISSION_LABELS[key] || key}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/roles/${role.id}`}>
                        <Edit className="mr-1 h-3 w-3" />
                        編集
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`${role.name} を削除しますか？`)) {
                          deleteMut.mutate(role.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
