import type { ProductionJob } from "./types.ts";
import {
  createTestAvanceJob,
  createTestProJob,
  createTestProductionJob,
} from "./fixtures.ts";

const KEY = "sa-production-jobs-v1";

export function loadProductionJobs(): ProductionJob[] {
  if (typeof window === "undefined") return defaultJobs();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const defaults = defaultJobs();
      localStorage.setItem(KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw) as ProductionJob[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultJobs();
  } catch {
    return defaultJobs();
  }
}

export function saveProductionJobs(jobs: ProductionJob[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function getProductionJob(id: string): ProductionJob | null {
  return loadProductionJobs().find((j) => j.id === id || j.projectId === id) ?? null;
}

export function upsertProductionJob(job: ProductionJob): void {
  const jobs = loadProductionJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  saveProductionJobs(jobs);
}

function defaultJobs(): ProductionJob[] {
  return [createTestProductionJob(), createTestAvanceJob(), createTestProJob()];
}
