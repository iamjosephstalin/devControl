"use client"

import { ReactNode } from "react"

interface PageContentProps {
  children: ReactNode
  className?: string
}

export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

interface PageGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export function PageGrid({ children, columns = 3, className = "" }: PageGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols]} gap-6 ${className}`}>
      {children}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}