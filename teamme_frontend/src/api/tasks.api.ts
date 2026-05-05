import { get, put } from "./http";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskBoardItem {
  id: number;
  teamId: number;
  teamName: string;
  teamStatus: string;
  title: string;
  description?: string | null;
  status: TaskStatus | string;
  dueAt?: string | null;
  assigneeUserId?: number | null;
  assigneeUsername?: string | null;
  createdByUsername?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  assignedToMe: boolean;
  overdue: boolean;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export function fetchMyTasks(): Promise<TaskBoardItem[]> {
  return get<TaskBoardItem[]>("/api/tasks");
}

export function updateTaskStatus(
  taskId: number,
  payload: UpdateTaskStatusPayload
): Promise<TaskBoardItem> {
  return put<TaskBoardItem>(`/api/tasks/${taskId}/status`, payload);
}