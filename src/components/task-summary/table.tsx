import React from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ITaskSummary } from '@/types'

interface Props {
  data: ITaskSummary[];
}

const TaskSummaryTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="border border-slate-200 rounded-sm mt-2">
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
          {data.map((summary, index) => (
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
  )
}

export default TaskSummaryTable