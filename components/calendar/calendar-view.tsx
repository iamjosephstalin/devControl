"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  priority?: "low" | "medium" | "high"
  status?: "backlog" | "in_progress" | "completed"
  project?: {
    id: string
    title: string
  } | null
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarView({ events, onDateClick, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const dateKey = format(event.date, "yyyy-MM-dd")
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)
    })
    return map
  }, [events])

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const priorityColors = {
    high: "bg-red-500/20 text-red-500 border-red-500/50",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    low: "bg-blue-500/20 text-blue-500 border-blue-500/50",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold font-mono w-[200px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium font-mono"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayEvents = eventsByDate.get(dateKey) || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] border-r border-b p-2",
                  !isCurrentMonth && "bg-muted/30",
                  isToday && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-mono mb-1",
                    isToday && "font-bold text-primary",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate",
                        event.priority && priorityColors[event.priority],
                        !event.priority && "bg-muted border-border"
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground font-mono">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

