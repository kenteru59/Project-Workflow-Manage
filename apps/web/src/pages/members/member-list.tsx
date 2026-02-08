import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMembers, useDeleteMember } from "@/hooks/use-members";
import { Plus, Trash2, Edit, Users, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MemberListPage() {
  const { data: members = [], isLoading } = useMembers();
  const deleteMut = useDeleteMember();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">メンバーマスタ</h1>
          <p className="text-muted-foreground">
            チームメンバーの管理と権限設定
          </p>
        </div>
        <Button asChild>
          <Link to="/members/new">
            <Plus className="mr-2 h-4 w-4" />
            メンバー追加
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              メンバーが登録されていません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={member.status === "active" ? "default" : "secondary"}>
                    {member.status === "active" ? "有効" : "無効"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">メールアドレス</p>
                    <p>{member.email || "未設定"}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/members/${member.id}`}>
                        <Edit className="mr-1 h-3 w-3" />
                        編集
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`${member.name} を削除しますか？`)) {
                          deleteMut.mutate(member.id);
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
