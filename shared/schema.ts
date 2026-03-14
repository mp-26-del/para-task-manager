import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("inbox"),
  deadline: text("deadline"),
  endDate: text("end_date"),
  frequency: text("frequency"),
  frequencyDay: integer("frequency_day"),
  frequencyWeekday: integer("frequency_weekday"),
  completed: boolean("completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  workspace: text("workspace").notNull().default("personal"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
