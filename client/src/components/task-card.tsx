import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FrequencyDetailPicker } from "./frequency-detail-picker";
import { Repeat, CalendarDays, Trash2, GripVertical } from "lucide-react";
import { format } from "date-fns";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi-yearly", label: "Bi-yearly" },
  { value: "yearly", label: "Yearly" },
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskCardProps {
  task: Task;
  showCheckbox?: boolean;
}

export function TaskCard({ task, showCheckbox = false }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");
  const [editEndDate, setEditEndDate] = useState(task.endDate || "");
  const [editFrequency, setEditFrequency] = useState(task.frequency || "");
  const [editFrequencyDay, setEditFrequencyDay] = useState<number | null>(task.frequencyDay ?? null);
  const [editFrequencyWeekday, setEditFrequencyWeekday] = useState<number | null>(task.frequencyWeekday ?? null);
  const [dismissing, setDismissing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
  });

  function handleDismiss() {
    setDismissing(true);
    setTimeout(() => {
      updateMutation.mutate({ completed: true });
    }, 300);
  }

  function handleEditSave() {
    updateMutation.mutate({
      title: editTitle,
      description: editDescription.trim() || null,
      deadline: editDeadline || null,
      endDate: editEndDate || null,
      frequency: editFrequency && editFrequency !== "none" ? editFrequency : null,
      frequencyDay: editFrequencyDay,
      frequencyWeekday: editFrequencyWeekday,
    });
    setEditOpen(false);
  }

  function handleEditFrequencyChange(val: string) {
    setEditFrequency(val);
    setEditFrequencyDay(null);
    setEditFrequencyWeekday(null);
  }

  function openEditDialog() {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDeadline(task.deadline || "");
    setEditEndDate(task.endDate || "");
    setEditFrequency(task.frequency || "");
    setEditFrequencyDay(task.frequencyDay ?? null);
    setEditFrequencyWeekday(task.frequencyWeekday ?? null);
    setEditOpen(true);
  }

  function formatFrequencyBadge(): string {
    if (!task.frequency) return "";
    if (task.frequency === "daily") return "Daily";
    if ((task.frequency === "weekly" || task.frequency === "bi-weekly") && task.frequencyWeekday !== null) {
      const prefix = task.frequency === "bi-weekly" ? "Bi-wk" : "Wk";
      return `${prefix} · ${WEEKDAY_NAMES[task.frequencyWeekday]}`;
    }
    if (task.frequencyDay !== null) {
      const labels: Record<string, string> = {
        monthly: "Mo",
        quarterly: "Qt",
        "bi-yearly": "½Y",
        yearly: "Yr",
      };
      return `${labels[task.frequency] || task.frequency} · ${getOrdinal(task.frequencyDay)}`;
    }
    return task.frequency;
  }

  const chips: { icon: typeof Repeat; text: string; muted?: boolean }[] = [];
  if (task.deadline) {
    chips.push({ icon: CalendarDays, text: format(new Date(task.deadline), "MMM d") });
  }
  if (task.frequency) {
    chips.push({ icon: Repeat, text: formatFrequencyBadge() });
  }
  if (task.endDate) {
    chips.push({ icon: CalendarDays, text: `→ ${format(new Date(task.endDate), "MMM d")}`, muted: true });
  }

  return (
    <>
      <div
        className={`group flex items-center gap-1.5 pl-1 pr-2 py-1.5 rounded-md border border-transparent hover:border-border hover:bg-accent/50 transition-all cursor-grab active:cursor-grabbing ${
          dismissing ? "opacity-0 -translate-x-4 h-0 py-0 overflow-hidden" : ""
        }`}
        style={{ transition: dismissing ? "all 300ms ease-out" : undefined }}
        data-testid={`task-card-${task.id}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button[role="checkbox"]')) return;
          openEditDialog();
        }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        {showCheckbox && (
          <Checkbox
            checked={false}
            onCheckedChange={() => handleDismiss()}
            className="shrink-0"
            data-testid={`task-checkbox-${task.id}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-sm leading-tight truncate">{task.title}</p>
          {chips.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 text-[10px] whitespace-nowrap ${
                    chip.muted ? "text-muted-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  <chip.icon className="w-2.5 h-2.5" />
                  {chip.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-base">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-sm"
                data-testid="edit-task-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description..."
                className="text-sm min-h-16 resize-none"
                data-testid="edit-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Deadline</Label>
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="text-sm"
                  data-testid="edit-task-deadline"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End date</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="text-sm"
                  data-testid="edit-task-end-date"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select value={editFrequency} onValueChange={handleEditFrequencyChange}>
                <SelectTrigger className="text-sm" data-testid="edit-task-frequency">
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
            {editFrequency && editFrequency !== "none" && (
              <FrequencyDetailPicker
                frequency={editFrequency}
                frequencyDay={editFrequencyDay}
                frequencyWeekday={editFrequencyWeekday}
                onDayChange={setEditFrequencyDay}
                onWeekdayChange={setEditFrequencyWeekday}
              />
            )}
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                deleteMutation.mutate();
                setEditOpen(false);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
              data-testid="edit-task-delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)} className="text-sm">
                Cancel
              </Button>
              <Button onClick={handleEditSave} className="text-sm" data-testid="edit-task-save">
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
