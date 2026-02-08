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
import { useRoles } from "@/hooks/use-roles";
import { Plus, Trash2, ArrowLeft, GripVertical, Edit } from "lucide-react";
import type { WorkflowStep, StepType, TaskPriority, Role } from "@workflow-app/shared";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface StepFormData {
  id: string; // dnd-kit 用の一時的なID
  order: number;
  name: string;
  type: StepType;
  approverRoles: string[];
}

interface PatternFormData {
  id?: string; // 既存パターンの場合はAPIのID
  name: string;
  description: string;
  stepId: string; // order ではなく id で紐付ける
  stepOrder: number; // API送信時用
  defaultAssigneeRole?: string;
  priority: TaskPriority;
}

// --- Sortable Item Component ---
function SortableStepItem({
  step,
  index,
  updateStep,
  removeStep,
  stepsCount,
  roles,
}: {
  step: StepFormData;
  index: number;
  updateStep: (index: number, field: string, value: any) => void;
  removeStep: (index: number) => void;
  stepsCount: number;
  roles: Role[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const toggleRole = (roleName: string, checked: boolean) => {
    const currentRoles = step.approverRoles || [];
    if (checked) {
      updateStep(index, "approverRoles", [...currentRoles, roleName]);
    } else {
      updateStep(index, "approverRoles", currentRoles.filter((r) => r !== roleName));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 p-3 border rounded-lg bg-background",
        isDragging && "opacity-50 shadow-lg border-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        <span className="text-sm font-medium text-muted-foreground w-6 text-center">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeStep(index)}
          disabled={stepsCount <= 1}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {step.type === "approval" && (
        <div className="ml-12 p-3 bg-muted/50 rounded-md space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">承認者ロール（複数選択可）</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`step-${step.id}-role-${r.id}`}
                  checked={(step.approverRoles || []).includes(r.name)}
                  onCheckedChange={(checked) => toggleRole(r.name, checked as boolean)}
                />
                <label
                  htmlFor={`step-${step.id}-role-${r.id}`}
                  className="text-xs font-medium leading-none cursor-pointer"
                >
                  {r.name}
                </label>
              </div>
            ))}
            {roles.length === 0 && (
              <p className="text-xs text-muted-foreground italic">ロールが登録されていません</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to generate a temporary ID
const generateTempId = () => Math.random().toString(36).substring(2, 9);

export function TemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: template, isLoading: isLoadingTemplate } = useTemplate(id || "");
  const { data: patterns = [], isLoading: isLoadingPatterns } = useTaskPatterns(id || "");
  const { data: roles = [] } = useRoles();
  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();
  const createPatternMut = useCreateTaskPattern();
  const deletePatternMut = useDeleteTaskPattern();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepFormData[]>([
    { id: generateTempId(), order: 1, name: "", type: "task", approverRoles: [] },
  ]);

  const [localPatterns, setLocalPatterns] = useState<PatternFormData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [newPattern, setNewPattern] = useState<PatternFormData>({
    name: "",
    description: "",
    stepId: "",
    stepOrder: 1,
    priority: "medium",
  });

  useEffect(() => {
    // 編集モードでデータがロードされ、かつ、まだ初期化されていない場合のみ実行
    if (isEdit && template && !isLoadingTemplate && !isLoadingPatterns && !isInitialized) {
      setName(template.name);
      setDescription(template.description);
      const newSteps = template.steps.map((s: any) => ({
        id: generateTempId(),
        order: s.order,
        name: s.name,
        type: s.type,
        approverRoles: s.approverRoles || (s.approverRole ? [s.approverRole] : []),
      }));
      setSteps(newSteps);

      // 既存のパターンを読み込み、stepOrderからstepIdを特定してセットする
      if (patterns && patterns.length > 0) {
        const mappedPatterns = patterns.map((p) => {
          const step = newSteps.find((s) => s.order === p.stepOrder);
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            stepId: step?.id || "",
            stepOrder: p.stepOrder,
            defaultAssigneeRole: p.defaultAssigneeRole,
            priority: p.priority,
          };
        });
        setLocalPatterns(mappedPatterns);
      }
      setIsInitialized(true);
    }
  }, [isEdit, template, patterns, isLoadingTemplate, isLoadingPatterns, isInitialized]);

  const addStep = () => {
    const newId = generateTempId();
    setSteps([
      ...steps,
      { id: newId, order: steps.length + 1, name: "", type: "task", approverRoles: [] },
    ]);
  };

  const removeStep = (index: number) => {
    const stepToRemove = steps[index];
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
    // 削除されたステップに紐付いていたタスクパターンも削除する
    setLocalPatterns(localPatterns.filter((p) => p.stepId !== stepToRemove.id));
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    (newSteps[index] as any)[field] = value;
    setSteps(newSteps);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const validSteps = steps.filter((s) => s.name.trim());
      if (!name.trim() || validSteps.length === 0) return;

      const data = {
        name,
        description,
        steps: validSteps.map((s, i) => ({
          order: i + 1,
          name: s.name,
          type: s.type,
          approverRoles: s.approverRoles || [],
        })),
      };

      let finalTemplateId = id;
      if (isEdit && id) {
        await updateMut.mutateAsync({ id, data });
      } else {
        const result = await createMut.mutateAsync(data);
        finalTemplateId = result.id;
      }

      if (!finalTemplateId) throw new Error("Template ID not found");

      // タスクパターンの更新処理
      // 1. 既存のパターンを一旦すべて削除
      if (isEdit && id && patterns && patterns.length > 0) {
        await Promise.all(
          patterns.map((p) =>
            deletePatternMut.mutateAsync({ templateId: id, patternId: p.id })
          )
        );
      }

      // 2. 現在のステップの並び順に基づいて stepOrder を計算し、登録する
      const allPatternsToSave = [...localPatterns];
      if (newPattern.name.trim() && newPattern.stepId) {
        allPatternsToSave.push(newPattern);
      }

      for (const p of allPatternsToSave) {
        const stepIndex = steps.findIndex((s) => s.id === p.stepId);
        if (stepIndex !== -1) {
          await createPatternMut.mutateAsync({
            templateId: finalTemplateId,
            data: {
              name: p.name,
              description: p.description,
              stepOrder: stepIndex + 1,
              defaultAssigneeRole: p.defaultAssigneeRole,
              priority: p.priority,
            },
          });
        }
      }
      
      navigate("/templates");
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("テンプレートの保存に失敗しました。");
    }
  };

  const handleAddPattern = async () => {
    if (!newPattern.name.trim() || !newPattern.stepId) return;

    if (editingIndex !== null) {
      // 更新モード
      const updatedPatterns = [...localPatterns];
      updatedPatterns[editingIndex] = { ...newPattern };
      setLocalPatterns(updatedPatterns);
      setEditingIndex(null);
    } else {
      // 追加モード
      setLocalPatterns([...localPatterns, { ...newPattern }]);
    }

    setNewPattern({
      name: "",
      description: "",
      stepId: "",
      stepOrder: 1,
      priority: "medium",
    });
  };

  const handleEditPattern = (index: number) => {
    setNewPattern({ ...localPatterns[index] });
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewPattern({
      name: "",
      description: "",
      stepId: "",
      stepOrder: 1,
      priority: "medium",
    });
  };

  const handleRemoveLocalPattern = (index: number) => {
    setLocalPatterns(localPatterns.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelEdit();
    }
  };

  if (isEdit && (isLoadingTemplate || isLoadingPatterns)) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <SortableStepItem
                    key={step.id}
                    step={step}
                    index={index}
                    updateStep={updateStep}
                    removeStep={removeStep}
                    stepsCount={steps.length}
                    roles={roles}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Task patterns */}
      <Card>
        <CardHeader>
          <CardTitle>タスクパターン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List local patterns */}
          {localPatterns.length > 0 && (
            <div className="space-y-2">
              {localPatterns.map((p, index) => {
                const step = steps.find((s) => s.id === p.stepId);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ステップ {step ? steps.indexOf(step) + 1 : "?"} ({step?.name || "不明"}) ・ 優先度: {p.priority} ・{" "}
                        {p.defaultAssigneeRole || "未割当"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPattern(index)}
                        className={cn(editingIndex === index && "text-primary bg-primary/10")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLocalPattern(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add pattern form */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">
              {editingIndex !== null ? "タスクパターン編集" : "タスクパターン追加"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={newPattern.name}
                onChange={(e) =>
                  setNewPattern({ ...newPattern, name: e.target.value })
                }
                placeholder="タスク名"
              />
              <Select
                value={newPattern.stepId}
                onValueChange={(v) =>
                  setNewPattern({
                    ...newPattern,
                    stepId: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステップを選択" />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s, i) => (
                    <SelectItem key={s.id} value={s.id}>
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
            <Select
              value={newPattern.defaultAssigneeRole || ""}
              onValueChange={(v) =>
                setNewPattern({
                  ...newPattern,
                  defaultAssigneeRole: v || undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="デフォルト担当者ロール" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddPattern}
                disabled={!newPattern.name.trim() || !newPattern.stepId}
                className="flex-1"
              >
                {editingIndex !== null ? (
                  <>
                    <Edit className="mr-1 h-3 w-3" />
                    更新
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    追加
                  </>
                )}
              </Button>
              {editingIndex !== null && (
                <Button variant="ghost" onClick={handleCancelEdit}>
                  キャンセル
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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