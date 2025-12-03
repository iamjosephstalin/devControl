"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, GripVertical } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface KanbanCardProps {
    task: any
}

export function KanbanCard({ task }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: "Task", task } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const priorityColors: Record<string, string> = {
        high: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        low: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-muted rounded-lg border-2 border-dashed h-[100px]"
            />
        )
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="cursor-grab active:cursor-grabbing group transition-all duration-200 hover:shadow-md hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95"
        >
            <CardHeader className="p-4 pb-3 space-y-0">
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                    </CardTitle>
                    <button 
                        {...attributes} 
                        {...listeners} 
                        className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-primary/10"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between">
                    <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-1 font-medium border ${priorityColors[task.priority]}`}
                    >
                        {task.priority}
                    </Badge>
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.dueDate)}</span>
                        </div>
                    )}
                </div>
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
