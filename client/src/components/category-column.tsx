import { useState, useMemo } from "react";
import type { Task } from "@shared/schema";
import { TaskCard } from "./task-card";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "default" | "title" | "deadline" | "frequency";

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  if (sortBy === "default") return tasks;
  return [...tasks].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "deadline") {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    if (sortBy === "frequency") {
      if (!a.frequency && !b.frequency) return 0;
      if (!a.frequency) return 1;
      if (!b.frequency) return -1;
      return a.frequency.localeCompare(b.frequency);
    }
    return 0;
  });
}

interface CategoryColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  color: string;
  bgColor: string;
  isLoading: boolean;
}

export function CategoryColumn({
  id,
  title,
  icon,
  tasks,
  color,
  bgColor,
  isLoading,
}: CategoryColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const sortedTasks = useMemo(() => sortTasks(tasks, sortBy), [tasks, sortBy]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full border-r border-border last:border-r-0 overflow-hidden transition-colors ${
        isOver ? "bg-primary/5" : ""
      }`}
      data-testid={`column-${id}`}
    >
      <div className={`px-4 py-3 border-b border-border ${bgColor}`}>
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <h2 className="text-sm font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">{tasks.length}</span>
        </div>
      </div>

      {tasks.length > 1 && (
        <div className="px-4 py-1.5 border-b border-border flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-6 text-[10px] border-0 shadow-none px-1.5 w-auto gap-1 bg-transparent hover:bg-accent/50 text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="frequency">Frequency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p className="text-xs opacity-60">Drop tasks here</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <TaskCard task={task} />
    </div>
  );
}
