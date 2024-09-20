import React from 'react'
import CheckboxItem from '../CheckboxItem'
import { IActivityFilters } from '@/types'

interface Props {
  activityFilters: IActivityFilters;
  setActivityFilters: (filters: IActivityFilters) => void;
}

const Filters: React.FC<Props> = ({ activityFilters, setActivityFilters }) => {

  const onActivityFilterChange = (key: keyof IActivityFilters, value: boolean) => {
    setActivityFilters({ ...activityFilters, [key]: value });
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 text-left">Filters</h3>
      <div className="flex gap-2">
        <div className="px-2 py-1 border-2 rounded-xl">
          <CheckboxItem
            id="task"
            label="Task"
            isChecked={activityFilters.task}
            onChange={() => onActivityFilterChange("task", !activityFilters.task)}
          />
        </div>
        <div className="px-2 py-1 border-2 rounded-xl">
          <CheckboxItem
            id="codeReview"
            label="Code Review"
            isChecked={activityFilters.codeReview}
            onChange={() => onActivityFilterChange("codeReview", !activityFilters.codeReview)}
          />
        </div>
        <div className="px-2 py-1 border-2 rounded-xl">
          <CheckboxItem
            id="assist"
            label="Assist"
            isChecked={activityFilters.assist}
            onChange={() => onActivityFilterChange("assist", !activityFilters.assist)}
          />
        </div>
        <div className="px-2 py-1 border-2 rounded-xl">
          <CheckboxItem
            id="deployment"
            label="Deployment"
            isChecked={activityFilters.deployment}
            onChange={() => onActivityFilterChange("deployment", !activityFilters.deployment)}
          />
        </div>
        <div className="px-2 py-1 border-2 rounded-xl">
          <CheckboxItem
            id="analysis"
            label="Planning/Analysis"
            isChecked={activityFilters.analysis}
            onChange={() => onActivityFilterChange("analysis", !activityFilters.analysis)}
          />
        </div>
      </div>
    </div>
  )
}

export default Filters