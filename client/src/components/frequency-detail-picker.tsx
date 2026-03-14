import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FrequencyDetailPickerProps {
  frequency: string;
  frequencyDay: number | null;
  frequencyWeekday: number | null;
  onDayChange: (day: number | null) => void;
  onWeekdayChange: (weekday: number | null) => void;
}

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: getOrdinal(i + 1),
}));

export function FrequencyDetailPicker({
  frequency,
  frequencyDay,
  frequencyWeekday,
  onDayChange,
  onWeekdayChange,
}: FrequencyDetailPickerProps) {
  if (frequency === "daily") return null;

  if (frequency === "weekly" || frequency === "bi-weekly") {
    return (
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">
          {frequency === "bi-weekly" ? "Every other" : "Every"}
        </Label>
        <Select
          value={frequencyWeekday !== null ? String(frequencyWeekday) : ""}
          onValueChange={(v) => onWeekdayChange(v ? parseInt(v) : null)}
        >
          <SelectTrigger className="text-xs h-7">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (
    frequency === "monthly" ||
    frequency === "quarterly" ||
    frequency === "bi-yearly" ||
    frequency === "yearly"
  ) {
    return (
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">On day</Label>
        <Select
          value={frequencyDay !== null ? String(frequencyDay) : ""}
          onValueChange={(v) => onDayChange(v ? parseInt(v) : null)}
        >
          <SelectTrigger className="text-xs h-7">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_DAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
