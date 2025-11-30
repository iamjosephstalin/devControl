"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Server, Terminal, Trash2, Play, Filter, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, FolderTree } from "lucide-react"
import { CreateServerDialog } from "@/components/infrastructure/create-server-dialog"
import { PageContainer, PageHeader, ViewModeToggle } from "@/components/layout/page-header"
import { PageContent, PageGrid, EmptyState } from "@/components/layout/page-content"
import { formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Server {
  id: string
  name: string
  host: string
  port: number
  username: string
  provider: string
  region: string | null
  project: {
    id: string
    title: string
  } | null
  domains: any[]
  createdAt: string
}

const commonCommands = [
  { name: "Git Pull", command: "cd /var/www && git pull" },
  { name: "PM2 Restart", command: "pm2 restart all" },
  { name: "PM2 Status", command: "pm2 status" },
  { name: "Restart Nginx", command: "sudo systemctl restart nginx" },
  { name: "Check Disk Space", command: "df -h" },
  { name: "Check Memory", command: "free -h" },
  { name: "View Logs", command: "tail -n 100 /var/log/nginx/error.log" },
]

type ViewMode = "grid" | "list"
type SortField = "name" | "host" | "provider" | "project" | "createdAt"
type SortDirection = "asc" | "desc"

export default function InfrastructurePage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [command, setCommand] = useState("")
  const [output, setOutput] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const { data: allServers = [], isLoading } = useQuery<Server[]>({
    queryKey: ["servers"],
    queryFn: async () => {
      const res = await fetch("/api/servers")
      if (!res.ok) throw new Error("Failed to fetch servers")
      return res.json()
    },
  })

  // Filter servers based on selected project
  const filteredServers = useMemo(() => {
    if (selectedProjectId === "general") {
      return allServers.filter((s) => !s.project)
    }
    if (selectedProjectId !== "all" && selectedProjectId) {
      return allServers.filter((s) => s.project?.id === selectedProjectId)
    }
    return allServers
  }, [allServers, selectedProjectId])

  // Sort servers
  const sortedServers = useMemo(() => {
    const sorted = [...filteredServers]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "host":
          aValue = a.host.toLowerCase()
          bValue = b.host.toLowerCase()
          break
        case "provider":
          aValue = a.provider.toLowerCase()
          bValue = b.provider.toLowerCase()
          break
        case "project":
          aValue = a.project?.title || ""
          bValue = b.project?.title || ""
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredServers, sortField, sortDirection])

  // Paginate servers
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedServers.slice(startIndex, endIndex)
  }, [sortedServers, currentPage])

  const totalPages = Math.ceil(sortedServers.length / itemsPerPage)

  const executeMutation = useMutation({
    mutationFn: async ({ serverId, command }: { serverId: string; command: string }) => {
      const res = await fetch(`/api/servers/${serverId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to execute command")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setOutput(data.stdout || data.stderr || "Command executed successfully")
    },
    onError: (error: any) => {
      setOutput(`Error: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete server")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] })
    },
  })

  const handleExecute = (cmd: string) => {
    if (!selectedServer) return
    setCommand(cmd)
    executeMutation.mutate({ serverId: selectedServer.id, command: cmd })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure"
        description="Manage your servers and execute commands"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="general">General</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Add Server
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${viewMode === "list" ? "lg:col-span-3" : "lg:col-span-2"} space-y-4`}>
          {viewMode === "grid" ? (
            filteredServers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No servers configured</p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Add Your First Server
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredServers.map((server) => (
                <Card key={server.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 break-all">
                          <Server className="h-5 w-5 shrink-0" />
                          {server.name}
                        </CardTitle>
                        <CardDescription className="mt-1 break-all">
                          {server.host}:{server.port} • {server.username}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{server.provider}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        {server.project ? (
                          <Badge variant="outline" className="mb-2">{server.project.title}</Badge>
                        ) : (
                          <Badge variant="secondary" className="mb-2">General</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Added {formatDate(server.createdAt)}</span>
                        {server.region && <span>Region: {server.region}</span>}
                      </div>
                      {server.domains && server.domains.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Domains:</p>
                          <div className="flex flex-wrap gap-2">
                            {server.domains.map((domain: any) => (
                              <Badge key={domain.id} variant="outline">
                                {domain.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/terminal/${server.id}`, '_blank')
                          }}
                        >
                          <Terminal className="mr-2 h-4 w-4" />
                          Terminal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/sftp/${server.id}`, '_blank')
                          }}
                        >
                          <FolderTree className="mr-2 h-4 w-4" />
                          SFTP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedServer(server)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Execute
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this server?"
                              )
                            ) {
                              deleteMutation.mutate(server.id)
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-500 dark:text-red-400" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Servers ({filteredServers.length})</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Showing {paginatedServers.length} of {filteredServers.length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            Name
                            <SortIcon field="name" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("host")}
                        >
                          <div className="flex items-center">
                            Host
                            <SortIcon field="host" />
                          </div>
                        </TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("provider")}
                        >
                          <div className="flex items-center">
                            Provider
                            <SortIcon field="provider" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("project")}
                        >
                          <div className="flex items-center">
                            Project
                            <SortIcon field="project" />
                          </div>
                        </TableHead>
                        <TableHead>Domains</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            Created
                            <SortIcon field="createdAt" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedServers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-muted-foreground">No servers found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedServers.map((server) => (
                          <TableRow key={server.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{server.name}</TableCell>
                            <TableCell className="font-mono text-sm">{server.host}</TableCell>
                            <TableCell className="font-mono text-sm">{server.port}</TableCell>
                            <TableCell className="font-mono text-sm">{server.username}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{server.provider}</Badge>
                            </TableCell>
                            <TableCell>
                              {server.project ? (
                                <Badge variant="secondary">{server.project.title}</Badge>
                              ) : (
                                <Badge variant="outline">General</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {server.domains && server.domains.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {server.domains.slice(0, 2).map((domain: any) => (
                                    <Badge key={domain.id} variant="outline" className="text-xs">
                                      {domain.name}
                                    </Badge>
                                  ))}
                                  {server.domains.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{server.domains.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatDate(server.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/terminal/${server.id}`, '_blank')
                                  }}
                                  title="Open Terminal"
                                >
                                  <Terminal className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/sftp/${server.id}`, '_blank')
                                  }}
                                  title="Open SFTP Browser"
                                >
                                  <FolderTree className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedServer(server)}
                                  title="Execute Command"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this server?"
                                      )
                                    ) {
                                      deleteMutation.mutate(server.id)
                                    }
                                  }}
                                  title="Delete Server"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>

        {viewMode === "grid" && (
          <div className="space-y-4">
            {selectedServer && (
              <Card>
                <CardHeader>
                  <CardTitle>Execute Command</CardTitle>
                  <CardDescription>
                    Run commands on {selectedServer.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quick Commands</Label>
                    <div className="mt-2 space-y-2">
                      {commonCommands.map((cmd) => (
                        <Button
                          key={cmd.name}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleExecute(cmd.command)}
                          disabled={executeMutation.isPending}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {cmd.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="command">Custom Command</Label>
                    <Input
                      id="command"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Enter command..."
                      className="mt-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && command) {
                          handleExecute(command)
                        }
                      }}
                    />
                    <Button
                      className="mt-2 w-full"
                      onClick={() => handleExecute(command)}
                      disabled={!command || executeMutation.isPending}
                    >
                      {executeMutation.isPending ? "Executing..." : "Execute"}
                    </Button>
                  </div>
                  {output && (
                    <div>
                      <Label>Output</Label>
                      <pre className="mt-2 rounded-lg bg-muted p-3 text-sm overflow-auto max-h-64 font-mono">
                        {output}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <CreateServerDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </PageContainer>
  )
}
