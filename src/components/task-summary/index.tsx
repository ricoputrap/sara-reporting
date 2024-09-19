import React from 'react'

import { ITaskSummary } from '@/types'
import ExportExcelButton from '@/components/ExportExcelButton';
import TaskSummaryTable from './table';
import { exportToExcel } from '@/lib/exportToExcel';

interface IRowData {
  ID: string,
  Name: string,
  Status: string,
  Estimation: string,
  Actual: string
}

interface Props {
  data: ITaskSummary[];
}

const TaskSummary: React.FC<Props> = ({ data }) => {
  const exportData = () => {
    const rows: IRowData[] = data.map((row) => ({
      ID: row.taskID,
      Name: row.name,
      Status: row.status,
      Estimation: row.actualEstimation + "",
      Actual: row.actualQuantity + ""
    }));

    exportToExcel<IRowData>(rows, "Task Summary")
  }

  return (
    <details className="mt-8">
      <summary className="text-left">Task Summary</summary>
      <div>
        <h3 className="text-lg font-medium mb-2 text-center">Task Summary</h3>
        <div className="flex justify-end">
          <ExportExcelButton onClick={exportData} />
        </div>

        <TaskSummaryTable data={data} />
      </div>
    </details>
  )
}

export default TaskSummary