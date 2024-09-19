import { useEffect, useState } from 'react';
import './App.css'
import FileUpload from './components/ui/file-upload'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import CheckboxItem from './components/ui/CheckboxItem';

interface IRawTimesheet {
  Date: number; // e.g. 45499
  Description: string;
  "Is Invoiceable": boolean;
  Project: string;
  Quantity: number;
  Task: string;
}

interface ITimesheet {
  date: number; // unix
  formattedDate: string;
  description: string;
  isInvoicable: boolean;
  project: string;
  quantity: number;
  timeSpent: string; // e.g. 1h 30m
  task: string;
}

interface ITask extends ITimesheet {
  parentID: string;
  taskID: string;
}

interface ITaskSummary {
  taskID: string;
  name: string;
  status: EnumJiraStatus;
  actualEstimation: number;
  timeEstimation: string;
  actualQuantity: number;
  timeSpent: string;
}

interface IWorkSummary {
  totalTasks: number;
  totalEstimation: string;
  totalTimeSpent: string;
  ratio: string;
}

interface IActivityFilters {
  task: boolean;
  codeReview: boolean;
  assist: boolean;
  deployment: boolean;
  analysis: boolean;
}

enum EnumJiraIssueType {
  BUG = "Bug",
  EPIC = "Epic",
  TASK = "Task",
  SUBTASK = "Subtask"
}

enum EnumJiraStatus {
  BACKLOG = "Backlog",
  IN_PROGRESS = "In Progress",
  TO_BE_MERGED = "To be Merged",
  IN_DEV = "IN DEV",
  IN_STAGING = "IN STAGING",
  DONE = "Done",
  CANCELLED = "Cancelled"
}

interface IRawJira {
  "Issue id": number;
  "Issue key": string;
  "Issue Type": EnumJiraIssueType;
  "Summary": string; // task name
  "Assignee": string;
  "Assignee Id": string;
  "Status": EnumJiraStatus;
  "Parent": number; // parent task id
  "Parent summary": string; // parent task name
  "Custom field (Story point estimate)": number;
}

interface IJiraTask {
  id: number;
  taskID: string;
  type: EnumJiraIssueType;
  name: string;
  assigneeName: string;
  assigneeID: string;
  status: EnumJiraStatus;
  parentID: number;
  parentName: string;
  storyPoint: number;
  timeEstimation: number; // from storyPoint to num of hours
}

const convertToUnix = (date: number) => {
  const DATE_26_JUL_24: number = 45499;
  const millisecond26jul24 = new Date(2022, 6, 26, 0, 0, 0).getTime();
  const diffFrom26jul24 = (date - DATE_26_JUL_24) * 24 * 60 * 60 * 1000;
  const realDate = millisecond26jul24 + diffFrom26jul24
  return realDate;
}

const calculateTimeSpent = (quantity: number) => {
  const hours = Math.floor(quantity);
  const minutes = (quantity - hours) * 60;
  
  let result = "";

  if (hours > 0) {
    result = hours + "h ";
  }

  if (minutes > 0) {
    result += minutes + "m";
  }

  return result;
}

const calculateTimeEstimation = (
  type: EnumJiraIssueType,
  storyPoint: number
): number => {
  if (type === EnumJiraIssueType.EPIC)
    return 0;

  // for a subtask, 1 SP = 1 hour
  if (type === EnumJiraIssueType.SUBTASK)
    return storyPoint || 0;

  switch (storyPoint) {
    case 1:
      return 2;
    case 2:
      return 4;
    case 3:
      return 8;

    // For tasks with SP > 3, the ttime estimation
    // will be calculated based on the subtasks
    default:
      return 0;
  }
}

/**
 * format timeEstimation to be like this example: "1h 30m"
 */
const formatTimeEstimation = (timeEstimation: number) => {
  let formattedTimeEstimation = "";

  const hours = Math.floor(timeEstimation);
  const minutes = (timeEstimation - hours) * 60;
  
  if (hours > 0) {
    formattedTimeEstimation += hours + "h ";
  }

  if (minutes > 0) {
    formattedTimeEstimation += minutes + "m";
  }

  return formattedTimeEstimation
}

function App() {
  const [jiraTasks, setJiraTasks] = useState<IJiraTask[]>([]);
  const [mapJiraTasks, setMapJiraTasks] = useState<Map<string, IJiraTask>>(new Map());

  const [allTasks, setAllTasks] = useState<ITask[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [taskSummaries, setTaskSummaries] = useState<ITaskSummary[]>([]);
  const [workSummary, setWorkSummary] = useState<IWorkSummary>({
    totalTasks: 0,
    totalEstimation: "",
    totalTimeSpent: "",
    ratio: "",
  });

  const [activityFilters, setActivityFilters] = useState<IActivityFilters>({
    task: true,
    codeReview: true,
    assist: true,
    deployment: true,
    analysis: false,
  });

  useEffect(() => {
    // Get the records from `preprocessedData` which the `description` contains `[SG-<something>]`
    const filteredByTask = allTasks.filter((entry) => {
      // skip code review tasks
      if (!activityFilters.codeReview && entry.description.toLocaleLowerCase().includes("code review"))
        return false;

      // skip assists
      if (!activityFilters.assist && entry.description.toLocaleLowerCase().includes("assist"))
        return false;

      // skip deployment
      if (!activityFilters.deployment && entry.description.toLocaleLowerCase().includes("deploy"))
        return false;

      // skip PM tasks
      if (!activityFilters.analysis && entry.description.toLocaleLowerCase().includes("pm"))
        return false;

      // skip ordinary task
      if (!activityFilters.task) {
        const isSkipped = !entry.description.toLocaleLowerCase().includes("code review")
          && !entry.description.toLocaleLowerCase().includes("assist")
          && !entry.description.toLocaleLowerCase().includes("deploy")
          && !entry.description.toLocaleLowerCase().includes("pm");

        if (isSkipped) return false;
      }

      return true;
    });
    setTasks(filteredByTask)

    const quantityPerTaskID: Record<string, number> = filteredByTask.reduce((
      acc: Record<string, number>,
      task
    ) => {
      if (!acc[task.taskID]) {
        acc[task.taskID] = 0;
      }

      acc[task.taskID] += task.quantity;
      return acc;
    }, {});

    const summaries: ITaskSummary[] = Object.entries(quantityPerTaskID).map((
      [taskID, actualQuantity]
    ) => {
      const jiraTask = mapJiraTasks.get(taskID);
      const formattedTimeEstimation = jiraTask ? formatTimeEstimation(jiraTask.timeEstimation) : "";

      return {
        taskID,
        name: jiraTask?.name || "",
        status: jiraTask?.status || EnumJiraStatus.BACKLOG,
        actualEstimation: jiraTask?.timeEstimation || 0,
        timeEstimation: formattedTimeEstimation,
        actualQuantity,
        timeSpent: calculateTimeSpent(actualQuantity),
      }
    });
    setTaskSummaries(summaries);

    const totalQuantity = summaries.reduce((acc, task) => acc + task.actualQuantity, 0);
    const totalEstimation = summaries.reduce((acc, task) => acc + task.actualEstimation, 0);

    // percentage ratio = (totalEstimation / totalQuantity)
    const ratio = (totalQuantity * 100 / totalEstimation).toFixed(2) + " %";

    const workSummary: IWorkSummary = {
      totalTasks: summaries.length,
      totalEstimation: formatTimeEstimation(totalEstimation),
      totalTimeSpent: calculateTimeSpent(totalQuantity),
      ratio
    };
    setWorkSummary(workSummary);
  }, [allTasks, activityFilters])

  const setJiraData = (data: IRawJira[]) => {
    const jiraTasks: IJiraTask[] = data.map((row) => {
      const timeEstimation = calculateTimeEstimation(
        row['Issue Type'],
        row['Custom field (Story point estimate)']
      );

      const task: IJiraTask = {
        id: row['Issue id'],
        taskID: row['Issue key'],
        type: row['Issue Type'],
        name: row['Summary'],
        assigneeName: row['Assignee'],
        assigneeID: row['Assignee Id'],
        status: row['Status'],
        parentID: row['Parent'],
        parentName: row['Parent summary'],
        storyPoint: row['Custom field (Story point estimate)'],
        timeEstimation
      }

      return task
    });

    // convert to hash map
    const jiraTaskMap = new Map<number, IJiraTask>();
    jiraTasks.forEach((task) => {
      jiraTaskMap.set(task.id, task);
    });

    // update parent task estimation
    jiraTasks.forEach((task) => {
      if (task.parentID) {
        const parent = jiraTaskMap.get(task.parentID);
        if (parent) {
          parent.timeEstimation += task.timeEstimation;
        }
      }
    });

    // update task estimation
    jiraTasks.forEach((task) => ({
      ...task,
      timeEstimation: jiraTaskMap.get(task.id)?.timeEstimation
    }));

    setJiraTasks(jiraTasks);

    // convert jiraTasks to map by the taskID
    const mapJiraTasks = new Map<string, IJiraTask>();
    jiraTasks.forEach((task) => {
      mapJiraTasks.set(task.taskID, task);
    });
    setMapJiraTasks(mapJiraTasks);
  }

  const setTimesheetData = (data: IRawTimesheet[]) => {
    const preprocessedData: ITimesheet[] = data.map((row) => {
      const date = convertToUnix(row.Date);
      const timeSpent: string = calculateTimeSpent(row.Quantity);
      return {
        date,
        formattedDate: new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        description: row.Description,
        isInvoicable: row["Is Invoiceable"],
        project: row.Project,
        quantity: row.Quantity,
        task: row.Task,
        timeSpent
      }
    });

    console.log("preprocessedData:", preprocessedData);
    // populate rowData: ITask[]
    const tasks: ITask[] = preprocessedData.reduce((
      acc: ITask[],
      task: ITimesheet
    ) => {
      // get only tasks registered in JIRA
      if (!task.description.includes("SG-")) return acc;

      const parentID = task.description.split("]")[0].split("[")[1];
      const taskID = task.description.split("]")[1].split("[")[1];
      acc.push({
        ...task,
        parentID,
        taskID
      });

      return acc;
    }, []);

    // sort tasks by parentID, taskID, and description in ASC
    tasks.sort((a, b) => {
      if (a.parentID < b.parentID) {
        return -1;
      }
      if (a.parentID > b.parentID) {
        return 1;
      }
      if (a.taskID < b.taskID) {
        return -1;
      }
      if (a.taskID > b.taskID) {
        return 1;
      }
      if (a.description < b.description) {
        return -1;
      }
      if (a.description > b.description) {
        return 1;
      }
      return 0;
    });
    setAllTasks(tasks);
  }

  const onActivityFilterChange = (key: keyof IActivityFilters, value: boolean) => {
    setActivityFilters({ ...activityFilters, [key]: value });
  };

  return (
    <main>
      <FileUpload<IRawJira>
        label="Upload JIRA"
        setData={setJiraData}
      />
      <FileUpload<IRawTimesheet>
        label="Upload Timesheet"
        setData={setTimesheetData}
      />

      <div className="mt-8 flex flex-col items-center gap-4">
        <h3 className="text-lg font-medium">Work Summary</h3>
        <div className="w-fit border border-slate-200 rounded-sm">
          <Table className="w-fit">
            <TableBody>
              <TableRow>
                <TableHead className="text-left w-52">Total Tasks</TableHead>
                <TableCell className="text-left">{workSummary.totalTasks}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="text-left w-52">Total Estimation</TableHead>
                <TableCell className="text-left">{workSummary.totalEstimation}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="text-left w-52">Total Time Spent</TableHead>
                <TableCell className="text-left">{workSummary.totalTimeSpent}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="text-left w-52">Ratio (Spent / Estimation)</TableHead>
                <TableCell className="text-left">{workSummary.ratio}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filters */}
      <details className="mt-8">
        <summary className="text-left">Filters</summary>
        <ol>
          <li>
            <CheckboxItem
              id="task"
              label="Task"
              isChecked={activityFilters.task}
              onChange={() => onActivityFilterChange("task", !activityFilters.task)}
            />
            <CheckboxItem
              id="codeReview"
              label="Code Review"
              isChecked={activityFilters.codeReview}
              onChange={() => onActivityFilterChange("codeReview", !activityFilters.codeReview)}
            />
            <CheckboxItem
              id="assist"
              label="Assist"
              isChecked={activityFilters.assist}
              onChange={() => onActivityFilterChange("assist", !activityFilters.assist)}
            />
            <CheckboxItem
              id="deployment"
              label="Deployment"
              isChecked={activityFilters.deployment}
              onChange={() => onActivityFilterChange("deployment", !activityFilters.deployment)}
            />
            <CheckboxItem
              id="analysis"
              label="Planning/Analysis"
              isChecked={activityFilters.analysis}
              onChange={() => onActivityFilterChange("analysis", !activityFilters.analysis)}
            />
          </li>
        </ol>
      </details>
      
      {/* Task Summary Table */}
      <details className="mt-8">
        <summary className="text-left">Task Summary</summary>
        <div>
          <h3 className="text-lg font-medium mb-2">Task Summary</h3>
          <div className="border border-slate-200 rounded-sm">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Task ID</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Estimation</TableHead>
                  <TableHead className="text-center">Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskSummaries.map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{summary.taskID}</TableCell>
                    <TableCell className="text-left">{summary.name}</TableCell>
                    <TableCell className="text-center">{summary.status}</TableCell>
                    <TableCell className="text-center">{summary.timeEstimation}</TableCell>
                    <TableCell className="text-center">{summary.timeSpent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </details>

      {/* JIRA Task Table */}
      <details className="mt-8">
        <summary className="text-left">JIRA Tasks</summary>
        <div>
          <h3 className="text-lg font-medium mb-2">JIRA Tasks</h3>
          <div className="border border-slate-200 rounded-sm">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Task ID</TableHead>
                  <TableHead className="text-center">Name</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Assignee</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Estimation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jiraTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-center">{task.taskID}</TableCell>
                    <TableCell className="text-center">{task.name}</TableCell>
                    <TableCell className="text-center">{task.type}</TableCell>
                    <TableCell className="text-center">{task.assigneeName}</TableCell>
                    <TableCell className="text-center">{task.status}</TableCell>
                    <TableCell className="text-center">{task.timeEstimation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </details>

      {/* Task Table  */}
      <details className="mt-8">
        <summary className="text-left">All Timesheet Records</summary>
        <div>
          <h3 className="text-lg font-medium mb-2">All Timesheet Records</h3>
          <div className="border border-slate-200 rounded-sm">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-24">Parent ID</TableHead>
                  <TableHead className="text-center w-24">Task ID</TableHead>
                  <TableHead className="text-center">Project</TableHead>
                  <TableHead className="text-center">Task</TableHead>
                  <TableHead className="text-center">Description</TableHead>
                  <TableHead className="text-center w-24">Actual</TableHead>
                  <TableHead className="text-center w-32">Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tasks.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center w-24">{task.parentID}</TableCell>
                    <TableCell className="text-center w-24">{task.taskID}</TableCell>
                    <TableCell className="text-center">{task.project}</TableCell>
                    <TableCell className="text-center">{task.task}</TableCell>
                    <TableCell className="text-center">{task.description}</TableCell>
                    <TableCell className="text-center w-24">{task.timeSpent}</TableCell>
                    <TableCell className="text-center w-32">{task.formattedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </details>
    </main>
  )
}

export default App
