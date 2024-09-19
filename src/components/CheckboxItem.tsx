import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"

interface Props {
  id: string;
  label: string;
  isChecked: boolean;
  onChange: () => void;
}


const CheckboxItem: React.FC<Props> = ({ id, label, isChecked, onChange }) => {
  return (
    <div className="flex items-center gap-2 min-h-[32px]">
      <Checkbox id={id} checked={isChecked} onCheckedChange={onChange} />
      <label
        htmlFor={id}
        className="m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  )
}

export default CheckboxItem