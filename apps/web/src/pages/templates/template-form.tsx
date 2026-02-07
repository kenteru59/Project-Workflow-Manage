import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useTaskPatterns,
  useCreateTaskPattern,
  useDeleteTaskPattern,
} from "@/hooks/use-templates";
import { Plus, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import type { WorkflowStep, StepType, TaskPriority } from "@workflow-app/shared";

interface StepFormData {
  order: number;
  name: string;
  type: StepType;
  approverRole?: string;
}

interface PatternFormData {
  name: string;
  description: string;
  stepOrder: number;
  defaultAssigneeRole?: string;
  priority: TaskPriority;
}

export function TemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: template } = useTemplate(id || "");
  const { data: patterns = [] } = useTaskPatterns(id || "");
  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();
  const createPatternMut = useCreateTaskPattern();
  const deletePatternMut = useDeleteTaskPattern();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepFormData[]>([
    { order: 1, name: "", type: "task" },
  ]);

  const [newPattern, setNewPattern] = useState<PatternFormData>({
    name: "",
    description: "",
    stepOrder: 1,
    priority: "medium",
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setSteps(
        template.steps.map((s) => ({
          order: s.order,
          name: s.name,
          type: s.type,
          approverRole: s.approverRole,
        }))
      );
    }
  }, [template]);

  const addStep = () => {
    setSteps([
      ...steps,
      { order: steps.length + 1, name: "", type: "task" },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    (newSteps[index] as any)[field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async () => {
    const validSteps = steps.filter((s) => s.name.trim());
    if (!name.trim() || validSteps.length === 0) return;

    const data = {
      name,
      description,
      steps: validSteps.map((s, i) => ({
        order: i + 1,
        name: s.name,
        type: s.type,
        ...(s.approverRole ? { approverRole: s.approverRole } : {}),
      })),
    };

    if (isEdit && id) {
      await updateMut.mutateAsync({ id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    navigate("/templates");
  };

  const handleAddPattern = async () => {
    if (!id || !newPattern.name.trim()) return;
    await createPatternMut.mutateAsync({
      templateId: id,
      data: newPattern,
    });
    setNewPattern({
      name: "",
      description: "",
      stepOrder: 1,
      priority: "medium",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/templates")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "テンプレート編集" : "テンプレート作成"}
          </h1>
          <p className="text-muted-foreground">
            ワークフローのステップとタスクパターンを定義します
          </p>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">テンプレート名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 休暇申請"
            />
          </div>
          <div>
            <label className="text-sm font-medium">説明</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="テンプレートの説明"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ステップ</CardTitle>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-1 h-3 w-3" />
              ステップ追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground w-6">
                {index + 1}
              </span>
              <Input
                value={step.name}
                onChange={(e) => updateStep(index, "name", e.target.value)}
                placeholder="ステップ名"
                className="flex-1"
              />
              <Select
                value={step.type}
                onValueChange={(v) => updateStep(index, "type", v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">タスク</SelectItem>
                  <SelectItem value="approval">承認</SelectItem>
                  <SelectItem value="auto">自動</SelectItem>
                </SelectContent>
              </Select>
              {step.type === "approval" && (
                <Input
                  value={step.approverRole || ""}
                  onChange={(e) =>
                    updateStep(index, "approverRole", e.target.value)
                  }
                  placeholder="承認者ロール"
                  className="w-36"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={steps.length <= 1}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Task patterns (edit mode only) */}
      {isEdit && id && (
        <Card>
          <CardHeader>
            <CardTitle>タスクパターン</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patterns.length > 0 && (
              <div className="space-y-2">
                {patterns.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ステップ {p.stepOrder} ・ 優先度: {p.priority} ・{" "}
                        {p.defaultAssigneeRole || "未割当"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deletePatternMut.mutate({
                          templateId: id,
                          patternId: p.id,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add pattern form */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">タスクパターン追加</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={newPattern.name}
                  onChange={(e) =>
                    setNewPattern({ ...newPattern, name: e.target.value })
                  }
                  placeholder="タスク名"
                />
                <Select
                  value={String(newPattern.stepOrder)}
                  onValueChange={(v) =>
                    setNewPattern({
                      ...newPattern,
                      stepOrder: Number(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステップ" />
                  </SelectTrigger>
                  <SelectContent>
                    {steps.map((s, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {i + 1}. {s.name || "(未入力)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newPattern.description}
                  onChange={(e) =>
                    setNewPattern({
                      ...newPattern,
                      description: e.target.value,
                    })
                  }
                  placeholder="説明"
                />
                <Select
                  value={newPattern.priority}
                  onValueChange={(v) =>
                    setNewPattern({
                      ...newPattern,
                      priority: v as TaskPriority,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={newPattern.defaultAssigneeRole || ""}
                onChange={(e) =>
                  setNewPattern({
                    ...newPattern,
                    defaultAssigneeRole: e.target.value || undefined,
                  })
                }
                placeholder="デフォルト担当者ロール"
              />
              <Button
                variant="outline"
                onClick={handleAddPattern}
                disabled={!newPattern.name.trim()}
              >
                <Plus className="mr-1 h-3 w-3" />
                追加
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          {isEdit ? "更新" : "作成"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/templates")}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
