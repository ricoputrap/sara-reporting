import { useState } from 'react';
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
  quantity: number;
  timeSpent: string;
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

function App() {
  // const [timesheets, setTimesheets] = useState<ITimesheet[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [taskSummaries, setTaskSummaries] = useState<ITaskSummary[]>([]);

  const setData = (data: IRawTimesheet[]) => {
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
    // setTimesheets(preprocessedData);

    // Get the records from `preprocessedData` which the `description` contains `[SG-<something>]`
    const filteredByTask = preprocessedData.filter((entry) => {
      // get only tasks registered in JIRA
      if (!entry.description.includes("SG-")) return false;

      // skip code review tasks
      if (entry.description.toLocaleLowerCase().includes("code review")) return false;
      
      return true;
    });
    console.table(filteredByTask);

    // populate rowData: ITask[]
    const tasks: ITask[] = filteredByTask.reduce((
      acc: ITask[],
      task: ITimesheet
    ) => {
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
    setTasks(tasks);

    const quantityPerTaskID: Record<string, number> = tasks.reduce((
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
      [taskID, quantity]
    ) => ({
      taskID,
      quantity,
      timeSpent: calculateTimeSpent(quantity),
    }));
    setTaskSummaries(summaries);

    const parentIDs = new Set<string>();
    const taskIDs = new Set<string>();
    filteredByTask.forEach((task) => {
      const parentID = task.description.split("]")[0].split("[")[1];
      parentIDs.add(parentID);

      const taskID = task.description.split("]")[1].split("[")[1];
      taskIDs.add(taskID);
    });

    console.log("parentIDs:", parentIDs);
    console.log("taskIDs:", taskIDs);

    const groupedByProject = preprocessedData
      .reduce((acc: Record<string, ITimesheet[]>, entry: ITimesheet) => {
        if (!acc[entry.project]) {
          acc[entry.project] = [];
        }
        acc[entry.project].push(entry);
        return acc;
      }, {});

    const quantityByProject = Object.entries(groupedByProject)
      .map(([project, entries]) => ({
        project,
        quantity: entries.reduce((acc, entry) => acc + entry.quantity, 0),
      }));
    console.table(quantityByProject);

    const groupedByTask = preprocessedData
      .reduce((acc: Record<string, ITimesheet[]>, entry: ITimesheet) => {
        if (!acc[entry.task]) {
          acc[entry.task] = [];
        }
        acc[entry.task].push(entry);
        return acc;
      }, {});

    const quantityByTask = Object.entries(groupedByTask)
      .map(([task, entries]) => ({
        task,
        quantity: entries.reduce((acc, entry) => acc + entry.quantity, 0),
      }));
    console.table(quantityByTask);
  }

  return (
    <main>
      <FileUpload<IRawTimesheet>
        label="Upload Timesheet"
        setData={setData}
      />

      {/* Task Summary Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Task Summary</h3>
        <div className="border border-slate-200 rounded-sm">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Task ID</TableHead>
                <TableHead className="text-center">Name</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Estimation</TableHead>
                <TableHead className="text-center">Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskSummaries.map((summary, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{summary.taskID}</TableCell>
                  <TableCell className="text-center"></TableCell>
                  <TableCell className="text-center">IN DEV</TableCell>
                  <TableCell className="text-center"></TableCell>
                  <TableCell className="text-center">{summary.timeSpent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Task Table  */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">All Tasks</h3>
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
    </main>
  )
}

export default App
