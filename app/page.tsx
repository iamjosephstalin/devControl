import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardOverview } from "@/components/dashboard/overview"
import { formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id

  // Fetch dashboard data
  const [projects, tasks, servers, secrets] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: {
          where: { status: { not: "completed" } },
          orderBy: { priority: "desc" },
          take: 1
        }
      },
    }),
    prisma.task.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.server.findMany({
      where: { userId },
    }),
    prisma.secret.findMany({
      where: { userId },
      take: 5,
    }),
  ])

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    const today = new Date()
    const due = new Date(task.dueDate)
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    )
  })

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high" && task.status !== "completed"
  )

  const activeProjects = projects.filter((p) => p.status === "active")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <DashboardOverview
        projects={projects}
        tasks={tasks}
        todayTasks={todayTasks}
        highPriorityTasks={highPriorityTasks}
        activeProjects={activeProjects}
        servers={servers}
        secrets={secrets}
      />
    </div>
  )
}

