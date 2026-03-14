import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";
import { TaskCard } from "./task-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Inbox, Plus, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { FrequencyDetailPicker } from "./frequency-detail-picker";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi-yearly", label: "Bi-yearly" },
  { value: "yearly", label: "Yearly" },
];

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

export function InboxPanel({ tasks, isLoading, workspace = "personal" }: { tasks: Task[]; isLoading: boolean; workspace?: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("");
  const [frequencyDay, setFrequencyDay] = useState<number | null>(null);
  const [frequencyWeekday, setFrequencyWeekday] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const { setNodeRef, isOver } = useDroppable({ id: "inbox" });

  const sortedTasks = useMemo(() => sortTasks(tasks, sortBy), [tasks, sortBy]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setTitle("");
      setDescription("");
      setDeadline("");
      setEndDate("");
      setFrequency("");
      setFrequencyDay(null);
      setFrequencyWeekday(null);
      setExpanded(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate({
      title: trimmed,
      description: description.trim() || null,
      category: "inbox",
      deadline: deadline || null,
      endDate: endDate || null,
      frequency: frequency && frequency !== "none" ? frequency : null,
      frequencyDay: frequencyDay,
      frequencyWeekday: frequencyWeekday,
      sortOrder: tasks.length,
      workspace: workspace,
    });
  }

  function handleFrequencyChange(val: string) {
    setFrequency(val);
    setFrequencyDay(null);
    setFrequencyWeekday(null);
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full transition-colors ${isOver ? "bg-primary/5" : ""}`}
      data-testid="inbox-panel"
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Inbox</h2>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">{tasks.length}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task..."
              className="text-sm h-8"
              data-testid="inbox-input"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2 shrink-0"
              disabled={createMutation.isPending || !title.trim()}
              data-testid="inbox-add-btn"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            data-testid="inbox-expand-toggle"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Less options" : "More options"}
          </button>

          {expanded && (
            <div className="space-y-2.5 pt-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="text-xs min-h-14 resize-none"
                  data-testid="inbox-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="text-xs h-7"
                    data-testid="inbox-deadline"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">End date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs h-7"
                    data-testid="inbox-end-date"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Frequency</Label>
                <Select value={frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger className="text-xs h-7" data-testid="inbox-frequency">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {frequency && frequency !== "none" && (
                <FrequencyDetailPicker
                  frequency={frequency}
                  frequencyDay={frequencyDay}
                  frequencyWeekday={frequencyWeekday}
                  onDayChange={setFrequencyDay}
                  onWeekdayChange={setFrequencyWeekday}
                />
              )}
            </div>
          )}
        </form>
      </div>

      {tasks.length > 1 && (
        <div className="px-4 py-1.5 border-b border-border flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-6 text-[10px] border-0 shadow-none px-1.5 w-auto gap-1 bg-transparent hover:bg-accent/50 text-muted-foreground" data-testid="inbox-sort">
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
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Inbox className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Your inbox is empty</p>
            <p className="text-xs mt-1 opacity-70">Add tasks above to get started</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task }: { task: Task }) {
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
      <TaskCard task={task} showCheckbox />
    </div>
  );
}
