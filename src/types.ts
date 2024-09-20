enum EnumJiraStatus {
  BACKLOG = "Backlog",
  IN_PROGRESS = "In Progress",
  TO_BE_MERGED = "To be Merged",
  IN_DEV = "IN DEV",
  IN_STAGING = "IN STAGING",
  DONE = "Done",
  CANCELLED = "Cancelled"
}

export interface ITaskSummary {
  taskID: string;
  name: string;
  status: EnumJiraStatus;
  actualEstimation: number; // e.g. 4
  timeEstimation: string;   // e.g. "4h"
  actualQuantity: number;   // e.g. 2.5
  timeSpent: string;        // e.g. "2h 30m"
}

export interface IActivityFilters {
  task: boolean;
  codeReview: boolean;
  assist: boolean;
  deployment: boolean;
  analysis: boolean;
}