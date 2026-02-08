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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMember,
  useCreateMember,
  useUpdateMember,
} from "@/hooks/use-members";
import { ArrowLeft } from "lucide-react";
import type { MemberStatus } from "@workflow-app/shared";

export function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: member } = useMember(id || "");
  const createMut = useCreateMember();
  const updateMut = useUpdateMember();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<MemberStatus>("active");

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email || "");
      setRole(member.role);
      setStatus(member.status);
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!name.trim() || !role.trim()) return;

    const data = {
      name,
      email,
      role,
      status,
    };

    if (isEdit && id) {
      await updateMut.mutateAsync({ id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    navigate("/members");
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/members")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "メンバー編集" : "メンバー登録"}
          </h1>
          <p className="text-muted-foreground">
            チームメンバーの情報を入力してください
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名前</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 山田 太郎"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ロール / 役職</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="例: リーダー, 承認者"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">メールアドレス</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ステータス</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MemberStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">有効</SelectItem>
                <SelectItem value="inactive">無効</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!name.trim() || !role.trim()}>
          {isEdit ? "更新" : "登録"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/members")}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
