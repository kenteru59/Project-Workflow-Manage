import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTemplates, useDeleteTemplate } from "@/hooks/use-templates";
import { Plus, Trash2, Edit, FileText } from "lucide-react";

export function TemplateListPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteMut = useDeleteTemplate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">テンプレート</h1>
          <p className="text-muted-foreground">
            ワークフローテンプレートの管理
          </p>
        </div>
        <Button asChild>
          <Link to="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              テンプレートがありません。新規作成してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tmpl.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tmpl.description || "説明なし"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      ステップ ({tmpl.steps.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.steps.map((step, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-xs px-2 py-0.5 bg-muted rounded-full"
                        >
                          {step.order}. {step.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/templates/${tmpl.id}`}>
                        <Edit className="mr-1 h-3 w-3" />
                        編集
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("このテンプレートを削除しますか？")) {
                          deleteMut.mutate(tmpl.id);
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
