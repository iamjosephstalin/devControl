"use client"

import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMemo } from "react"
import { KanbanCard } from "./kanban-card"
import { Badge } from "@/components/ui/badge"

interface KanbanColumnProps {
    column: {
        id: string
        title: string
    }
    tasks: any[]
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

    const { setNodeRef } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    })

    const countColors: Record<string, string> = {
        backlog: "bg-gray-500/10 text-gray-500",
        todo: "bg-blue-500/10 text-blue-500",
        in_progress: "bg-yellow-500/10 text-yellow-500",
        review: "bg-purple-500/10 text-purple-500",
        completed: "bg-green-500/10 text-green-500",
    }

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col gap-4 w-[300px] min-w-[300px] bg-muted/30 p-4 rounded-xl border h-full max-h-[calc(100vh-200px)]"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    {column.title}
                </h3>
                <Badge variant="secondary" className={countColors[column.id] || "bg-muted"}>
                    {tasks.length}
                </Badge>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[100px]">
                <SortableContext items={taskIds}>
                    {tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}
