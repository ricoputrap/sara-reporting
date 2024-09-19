import React from 'react'
import { Sheet } from "lucide-react"
import { Button } from './ui/button'

interface Props {
  onClick: () => void
}

const ExportExcelButton: React.FC<Props> = ({ onClick }) => {
  return (
    <Button onClick={onClick}>
      <Sheet className="mr-2 h-4 w-4" /> Export
    </Button>
  )
}

export default ExportExcelButton