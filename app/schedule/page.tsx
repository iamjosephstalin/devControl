"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Calendar,
  Clock,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  Settings,
  ExternalLink,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CalendarView } from "@/components/calendar/calendar-view"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Task {
  id: string
  title: string
  description: string | null
  status: "backlog" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  dueDate: string | null
  project: {
    id: string
    title: string
  } | null
}

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [googleAccessToken, setGoogleAccessToken] = useState("")
  const [selectedCalendarId, setSelectedCalendarId] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks")
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
  })

  // Fetch Google Calendars
  const { data: googleCalendars = [] } = useQuery({
    queryKey: ["google-calendars", googleAccessToken],
    queryFn: async () => {
      if (!googleAccessToken) return []
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      )
      if (!res.ok) throw new Error("Failed to fetch calendars")
      const data = await res.json()
      return data.items || []
    },
    enabled: !!googleAccessToken,
  })

  // Convert tasks to calendar events
  const calendarEvents = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate && task.status !== "completed")
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: new Date(task.dueDate!),
        priority: task.priority,
        status: task.status,
        project: task.project,
      }))
  }, [tasks])

  const today = new Date()
  const todayTasks = tasks.filter((task: Task) => {
    if (!task.dueDate) return false
    const due = new Date(task.dueDate)
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    )
  })

  const upcomingTasks = tasks
    .filter((task: Task) => {
      if (!task.dueDate || task.status === "completed") return false
      const due = new Date(task.dueDate)
      return due > today
    })
    .sort((a: Task, b: Task) => {
      const dateA = new Date(a.dueDate!).getTime()
      const dateB = new Date(b.dueDate!).getTime()
      return dateA - dateB
    })
    .slice(0, 10)

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!googleAccessToken || !selectedCalendarId) {
        throw new Error("Please provide access token and select a calendar")
      }

      // Sync tasks to Google Calendar
      const tasksToSync = tasks.filter(
        (task) => task.dueDate && task.status !== "completed"
      )

      const results = await Promise.allSettled(
        tasksToSync.map(async (task) => {
          const startDate = new Date(task.dueDate!)
          const endDate = new Date(startDate)
          endDate.setHours(endDate.getHours() + 1) // 1 hour duration

          const event = {
            summary: task.title,
            description: task.description || "",
            start: {
              dateTime: startDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            reminders: {
              useDefault: true,
            },
          }

          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${googleAccessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(event),
            }
          )

          if (!res.ok) throw new Error(`Failed to sync task: ${task.title}`)
          return res.json()
        })
      )

      const failed = results.filter((r) => r.status === "rejected")
      if (failed.length > 0) {
        throw new Error(`${failed.length} tasks failed to sync`)
      }

      return results.length
    },
    onSuccess: () => {
      setIsSyncing(false)
      setIsSyncDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onError: () => {
      setIsSyncing(false)
    },
  })

  const handleSync = () => {
    setIsSyncing(true)
    syncMutation.mutate()
  }

  const handleGoogleAuth = () => {
    // Redirect to Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const scope = "https://www.googleapis.com/auth/calendar"
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    window.location.href = authUrl
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Your daily and weekly schedule with calendar view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSyncDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Calendar Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                View your tasks on a calendar. Click on a task to view details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CalendarView
                  events={calendarEvents}
                  onEventClick={(event) => {
                    // Handle event click - could open a modal or navigate
                    console.log("Event clicked:", event)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today&apos;s Tasks
              </CardTitle>
              <CardDescription>
                Tasks due today ({todayTasks.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tasks due today
                </p>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.project && (
                            <Badge variant="secondary">
                              {task.project.title}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "outline"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">{task.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>
                Next 10 upcoming tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming tasks
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(task.dueDate!)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {task.project && (
                            <Badge variant="secondary">
                              {task.project.title}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "outline"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calendar Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calendar Sync Settings</DialogTitle>
            <DialogDescription>
              Connect your Google Calendar to sync tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!googleAccessToken ? (
              <div className="space-y-4">
                <div>
                  <Label>Google Calendar Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your access token"
                    value={googleAccessToken}
                    onChange={(e) => setGoogleAccessToken(e.target.value)}
                    className="mt-2 font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Get your access token from{" "}
                    <a
                      href="https://developers.google.com/oauth-playground"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google OAuth Playground
                    </a>
                  </p>
                </div>
                <Button onClick={handleGoogleAuth} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Authenticate with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Select Calendar</Label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                  >
                    <option value="">Select a calendar</option>
                    {googleCalendars.map((cal: any) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary && "(Primary)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={!selectedCalendarId || isSyncing}
                    className="flex-1"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Sync Tasks to Calendar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGoogleAccessToken("")}
                  >
                    Disconnect
                  </Button>
                </div>
                {syncMutation.isSuccess && (
                  <p className="text-sm text-green-500">
                    Successfully synced {syncMutation.data} tasks to Google Calendar!
                  </p>
                )}
                {syncMutation.isError && (
                  <p className="text-sm text-destructive">
                    {syncMutation.error?.message || "Failed to sync tasks"}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
