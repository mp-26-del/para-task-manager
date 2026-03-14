import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";

export async function registerRoutes(server: Server, app: Express) {
  app.get("/api/tasks", async (req, res) => {
    let tasks = await storage.getTasks();
    const ws = req.query.workspace as string | undefined;
    if (ws === "personal" || ws === "work") {
      tasks = tasks.filter((t) => t.workspace === ws);
    }
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const task = await storage.updateTask(id, req.body);
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const deleted = await storage.deleteTask(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  });
}
