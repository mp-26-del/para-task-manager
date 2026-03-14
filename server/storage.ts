import type { Task, InsertTask } from "@shared/schema";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
}

interface DataFile {
  nextId: number;
  tasks: Task[];
}

export class FileStorage implements IStorage {
  private tasks: Map<number, Task>;
  private currentId: number;

  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const data: DataFile = JSON.parse(raw);
        this.currentId = data.nextId;
        for (const task of data.tasks) {
          this.tasks.set(task.id, task);
        }
      }
    } catch (err) {
      console.error("Failed to load data file, starting fresh:", err);
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data: DataFile = {
        nextId: this.currentId,
        tasks: Array.from(this.tasks.values()),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save data file:", err);
    }
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => !t.completed)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description ?? null,
      category: insertTask.category ?? "inbox",
      deadline: insertTask.deadline ?? null,
      endDate: insertTask.endDate ?? null,
      frequency: insertTask.frequency ?? null,
      frequencyDay: insertTask.frequencyDay ?? null,
      frequencyWeekday: insertTask.frequencyWeekday ?? null,
      completed: insertTask.completed ?? false,
      sortOrder: insertTask.sortOrder ?? 0,
      workspace: insertTask.workspace ?? "personal",
    };
    this.tasks.set(id, task);
    this.saveToDisk();
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated: Task = { ...existing, ...updates };
    this.tasks.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = this.tasks.delete(id);
    if (result) this.saveToDisk();
    return result;
  }
}

export const storage = new FileStorage();
