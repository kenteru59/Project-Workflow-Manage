import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useTasks, useUpdateTaskStatus } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@workflow-app/shared";

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "未着手", color: "border-t-slate-400" },
  { id: "in_progress", title: "進行中", color: "border-t-blue-500" },
  { id: "review", title: "レビュー", color: "border-t-amber-500" },
  { id: "done", title: "完了", color: "border-t-green-500" },
];

function TaskCard({
  task,
  isDragOverlay,
}: {
  task: Task;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragOverlay ? "shadow-lg rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{task.title}</p>
        <StatusBadge type="priority" value={task.priority} />
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {task.assignee || "未割当"}
        </span>
        <span className="text-xs text-muted-foreground">S{task.stepOrder}</span>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
}: {
  column: (typeof columns)[0];
  tasks: Task[];
}) {
  return (
    <div className={`flex flex-col bg-muted/50 rounded-xl border-t-4 ${column.color} min-h-[500px]`}>
      <div className="p-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanPage() {
  const { data: allTasks = [], isLoading } = useTasks();
  const updateStatusMut = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Optimistic state for smooth drag
  const [optimisticMoves, setOptimisticMoves] = useState<
    Record<string, TaskStatus>
  >({});

  const tasks = allTasks.map((t) =>
    optimisticMoves[t.id]
      ? { ...t, status: optimisticMoves[t.id] }
      : t
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target column
    let targetStatus: TaskStatus | null = null;

    // Check if dropped over a column (by finding which column the over element belongs to)
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      targetStatus = overTask.status;
    } else {
      // Dropped on column itself
      const colId = String(over.id);
      if (columns.some((c) => c.id === colId)) {
        targetStatus = colId as TaskStatus;
      }
    }

    if (!targetStatus || targetStatus === task.status) return;

    // Optimistic update
    setOptimisticMoves((prev) => ({ ...prev, [taskId]: targetStatus! }));

    updateStatusMut.mutate(
      { id: taskId, status: targetStatus },
      {
        onSettled: () => {
          setOptimisticMoves((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        },
      }
    );
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dragging over a different column
    let targetStatus: TaskStatus | null = null;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      targetStatus = overTask.status;
    } else {
      const colId = String(over.id);
      if (columns.some((c) => c.id === colId)) {
        targetStatus = colId as TaskStatus;
      }
    }

    if (targetStatus && targetStatus !== activeTask.status) {
      setOptimisticMoves((prev) => ({
        ...prev,
        [String(active.id)]: targetStatus!,
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 h-full">
      <div>
        <h1 className="text-2xl font-bold">カンバンボード</h1>
        <p className="text-muted-foreground">
          ドラッグ&ドロップでタスクのステータスを変更
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={getTasksByStatus(col.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
