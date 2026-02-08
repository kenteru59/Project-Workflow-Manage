import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useRole,
  useCreateRole,
  useUpdateRole,
} from "@/hooks/use-roles";
import { ArrowLeft } from "lucide-react";
import type { RolePermissions } from "@workflow-app/shared";

// Role permission labels for the UI
const PERMISSION_LABELS: Record<keyof RolePermissions, string> = {
  member: "メンバー (一般作業者)",
  lead: "リード (チームリーダー)",
  requester: "申請者 (ワークフロー開始)",
  approver: "承認者 (承認ステップ担当)",
  admin: "管理者 (システム設定)",
};

export function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: role } = useRole(id || "");
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>({
    member: false,
    lead: false,
    requester: false,
    approver: false,
    admin: false,
  });

  useEffect(() => {
    if (role) {
      setName(role.name);
      setPermissions(role.permissions);
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      name,
      permissions,
    };

    if (isEdit && id) {
      await updateMut.mutateAsync({ id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    navigate("/roles");
  };

  const handlePermissionChange = (key: keyof RolePermissions, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roles")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "ロール編集" : "ロール登録"}
          </h1>
          <p className="text-muted-foreground">
            ロール名と権限を設定してください
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ロール情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">ロール名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 一般社員, マネージャー"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">権限設定</label>
            <div className="grid gap-4 border rounded-lg p-4">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${key}`}
                    checked={permissions[key as keyof RolePermissions]}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(key as keyof RolePermissions, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`perm-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          {isEdit ? "更新" : "登録"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/roles")}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
