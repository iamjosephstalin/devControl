"use client"

import { useState, useMemo, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface KanbanBoardProps {
    tasks: any[]
    projectId: string
}

const COLUMNS = [
    { id: "backlog", title: "Backlog" },
    { id: "in_progress", title: "In Progress" },
    { id: "completed", title: "Completed" },
]

export function KanbanBoard({ tasks: initialTasks, projectId }: KanbanBoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [activeTask, setActiveTask] = useState<any>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement before drag starts to prevent accidental clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const reorderMutation = useMutation({
        mutationFn: async (newTasks: any[]) => {
            const res = await fetch("/api/tasks/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasks: newTasks, projectId }),
            })
            if (!res.ok) throw new Error("Failed to reorder tasks")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
        },
    })

    function onDragStart(event: DragStartEvent) {
        const { active } = event
        if (active.data.current?.type === "Task") {
            setActiveTask(active.data.current.task)
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveTask = active.data.current?.type === "Task"
        const isOverTask = over.data.current?.type === "Task"

        if (!isActiveTask) return

        // Dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId)
                const overIndex = tasks.findIndex((t) => t.id === overId)

                if (tasks[activeIndex].status !== tasks[overIndex].status) {
                    const newTasks = [...tasks]
                    newTasks[activeIndex].status = tasks[overIndex].status
                    return arrayMove(newTasks, activeIndex, overIndex)
                }

                return arrayMove(tasks, activeIndex, overIndex)
            })
        }

        const isOverColumn = over.data.current?.type === "Column"

        // Dropping a Task over a Column
        if (isActiveTask && isOverColumn) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId)
                const newTasks = [...tasks]
                newTasks[activeIndex].status = overId as string
                return arrayMove(newTasks, activeIndex, activeIndex)
            })
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveTask(null)
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)

        if (activeIndex !== -1) {
            // Persist the new order and status
            const newTasks = [...tasks]
            // If dropped over a column, status is already updated in onDragOver
            // If dropped over a task, status is also updated in onDragOver

            // We need to ensure the order is correct in the state before sending
            // arrayMove might have happened in onDragOver for visual feedback

            // Trigger mutation to save changes
            reorderMutation.mutate(newTasks.map((t, index) => ({ id: t.id, status: t.status, position: index })))
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-4 h-full overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        tasks={tasks.filter((task) => task.status === col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? <KanbanCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    )
}
