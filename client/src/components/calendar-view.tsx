import { useState, useMemo } from "react";
import type { Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Repeat } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  getDay,
  getDate,
  differenceInCalendarWeeks,
} from "date-fns";

interface CalendarViewProps {
  tasks: Task[];
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  projects: "bg-blue-500",
  areas: "bg-green-500",
  resources: "bg-yellow-500",
  archives: "bg-purple-500",
  inbox: "bg-gray-400",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRecurringDatesInMonth(
  task: Task,
  monthStart: Date,
  monthEnd: Date
): Date[] {
  if (!task.frequency) return [];

  const dates: Date[] = [];
  const startDate = task.deadline ? parseISO(task.deadline) : null;
  const endDate = task.endDate ? parseISO(task.endDate) : null;

  // Check if there's a start date and it's after the month end
  if (startDate && startDate > monthEnd) return [];
  // Check if there's an end date and it's before the month start
  if (endDate && endDate < monthStart) return [];

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  for (const day of allDays) {
    // Skip days before the task's start date
    if (startDate && day < startDate) continue;
    // Skip days after the task's end date
    if (endDate && day > endDate) continue;

    let matches = false;

    switch (task.frequency) {
      case "daily":
        matches = true;
        break;

      case "weekly":
        if (task.frequencyWeekday !== null && task.frequencyWeekday !== undefined) {
          matches = getDay(day) === task.frequencyWeekday;
        } else if (startDate) {
          matches = getDay(day) === getDay(startDate);
        }
        break;

      case "bi-weekly":
        if (task.frequencyWeekday !== null && task.frequencyWeekday !== undefined) {
          if (getDay(day) === task.frequencyWeekday) {
            // Check if it's on the right bi-weekly cycle
            const weeksSinceStart = startDate
              ? differenceInCalendarWeeks(day, startDate)
              : 0;
            matches = weeksSinceStart % 2 === 0;
          }
        } else if (startDate) {
          if (getDay(day) === getDay(startDate)) {
            const weeksSinceStart = differenceInCalendarWeeks(day, startDate);
            matches = weeksSinceStart % 2 === 0;
          }
        }
        break;

      case "monthly":
        if (task.frequencyDay !== null && task.frequencyDay !== undefined) {
          matches = getDate(day) === task.frequencyDay;
        } else if (startDate) {
          matches = getDate(day) === getDate(startDate);
        }
        break;

      case "quarterly": {
        const refDate = startDate || monthStart;
        const refMonth = refDate.getMonth();
        const dayMonth = day.getMonth();
        const monthDiff = (dayMonth - refMonth + 12) % 12;
        if (monthDiff % 3 === 0) {
          const dayOfMonth =
            task.frequencyDay !== null && task.frequencyDay !== undefined
              ? task.frequencyDay
              : getDate(refDate);
          matches = getDate(day) === dayOfMonth;
        }
        break;
      }

      case "bi-yearly": {
        const refDate = startDate || monthStart;
        const refMonth = refDate.getMonth();
        const dayMonth = day.getMonth();
        const monthDiff = (dayMonth - refMonth + 12) % 12;
        if (monthDiff % 6 === 0) {
          const dayOfMonth =
            task.frequencyDay !== null && task.frequencyDay !== undefined
              ? task.frequencyDay
              : getDate(refDate);
          matches = getDate(day) === dayOfMonth;
        }
        break;
      }

      case "yearly": {
        const refDate = startDate || monthStart;
        if (day.getMonth() === refDate.getMonth()) {
          const dayOfMonth =
            task.frequencyDay !== null && task.frequencyDay !== undefined
              ? task.frequencyDay
              : getDate(refDate);
          matches = getDate(day) === dayOfMonth;
        }
        break;
      }
    }

    if (matches) dates.push(day);
  }

  return dates;
}

export function CalendarView({ tasks, isLoading }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Build a map: dateString -> tasks appearing on that date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    for (const task of tasks) {
      // One-time deadline
      if (task.deadline && !task.frequency) {
        const key = task.deadline;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }

      // Recurring task
      if (task.frequency) {
        const recurDates = getRecurringDatesInMonth(task, monthStart, monthEnd);
        for (const d of recurDates) {
          const key = format(d, "yyyy-MM-dd");
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(task);
        }
      }
    }

    return map;
  }, [tasks, currentMonth]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 h-full" style={{ minHeight: "480px" }}>
          {calDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(key) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={key}
                className={`border-r border-b border-border p-1 min-h-[80px] last:border-r-0 ${
                  !isCurrentMonth ? "bg-muted/30" : ""
                } ${isCurrentDay ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                      isCurrentDay
                        ? "bg-primary text-primary-foreground"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task, i) => (
                    <div
                      key={`${task.id}-${i}`}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-0.5 ${
                        CATEGORY_COLORS[task.category] || "bg-gray-400"
                      } text-white`}
                    >
                      {task.frequency && <Repeat className="w-2 h-2 shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
