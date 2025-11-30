"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode // For action buttons and controls
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="p-8">
      {children}
    </div>
  )
}

interface ViewModeToggleProps {
  viewMode: string
  onViewModeChange: (mode: string) => void
  gridIcon?: ReactNode
  listIcon?: ReactNode
  gridValue?: string
  listValue?: string
}

export function ViewModeToggle({ 
  viewMode, 
  onViewModeChange, 
  gridIcon, 
  listIcon,
  gridValue = "grid",
  listValue = "list"
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 border rounded-md">
      <Button
        variant={viewMode === gridValue ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange(gridValue)}
        className="rounded-r-none"
      >
        {gridIcon}
      </Button>
      <Button
        variant={viewMode === listValue ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange(listValue)}
        className="rounded-l-none"
      >
        {listIcon}
      </Button>
    </div>
  )
}