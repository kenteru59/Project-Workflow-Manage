import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useTemplates } from "@/hooks/use-templates";
import { useCreateWorkflow } from "@/hooks/use-workflows";
import { useUIStore } from "@/stores/ui-store";
import { ArrowLeft } from "lucide-react";

export function WorkflowNewPage() {
  const navigate = useNavigate();
  const { data: templates = [] } = useTemplates();
  const createMut = useCreateWorkflow();
  const { currentUser } = useUIStore();

  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const handleSubmit = async () => {
    if (!templateId || !name.trim()) return;
    const result = await createMut.mutateAsync({
      templateId,
      name,
      createdBy: currentUser?.name || "システム",
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
    navigate(`/workflows/${result.workflow.id}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workflows")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ワークフロー作成</h1>
          <p className="text-muted-foreground">
            テンプレートからワークフローを開始します
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テンプレート選択</CardTitle>
          <CardDescription>
            使用するテンプレートを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="テンプレートを選択" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedTemplate.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTemplate.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTemplate.steps.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-background rounded-full border"
                  >
                    {s.order}. {s.name} ({s.type === "task" ? "タスク" : s.type === "approval" ? "承認" : "自動"})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ワークフロー情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">ワークフロー名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 2024年1月 休暇申請"
            />
          </div>
          <div>
            <label className="text-sm font-medium">期限（任意）</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!templateId || !name.trim() || createMut.isPending}
        >
          {createMut.isPending ? "作成中..." : "ワークフロー開始"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/workflows")}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
