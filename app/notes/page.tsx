"use client"

import {
  Filter,
  Plus,
  List,
  Grid3x3,
  Folder,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

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
import { CreateNoteDialog } from "@/components/notes/create-dialog"
import { NoteViewerModal } from "@/components/notes/note-viewer-modal"
import { formatDate } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Note {
  id: string
  title: string
  content: string
  tags: string | null
  project: {
    id: string
    title: string
  } | null
  createdAt: string
  updatedAt: string
}

type ViewMode = "grid" | "list"
type SortField = "title" | "updatedAt" | "createdAt" | "project"
type SortDirection = "asc" | "desc"

export default function NotesPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
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

  const { data: allNotes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes")
      if (!res.ok) throw new Error("Failed to fetch notes")
      return res.json()
    },
  })

  // Filter notes based on selected project
  const filteredNotes = useMemo(() => {
    let notes = allNotes
    if (selectedProjectId === "general") {
      notes = allNotes.filter((n) => !n.project)
    } else if (selectedProjectId !== "all" && selectedProjectId) {
      notes = allNotes.filter((n) => n.project?.id === selectedProjectId)
    }
    return notes
  }, [allNotes, selectedProjectId])

  // Extract folders from tags
  const folders = useMemo(() => {
    const folderSet = new Set<string>()
    allNotes.forEach(note => {
      if (note.tags) {
        const tags = JSON.parse(note.tags)
        tags.forEach((tag: string) => {
          if (tag.startsWith("folder:")) {
            folderSet.add(tag.replace("folder:", ""))
          }
        })
      }
    })
    return Array.from(folderSet).sort()
  }, [allNotes])

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const folderFilteredNotes = useMemo(() => {
    if (!selectedFolder) return filteredNotes
    return filteredNotes.filter(note => {
      if (!note.tags) return false
      const tags = JSON.parse(note.tags)
      return tags.includes(`folder:${selectedFolder}`)
    })
  }, [filteredNotes, selectedFolder])

  // Sort notes
  const sortedNotes = useMemo(() => {
    const sorted = [...folderFilteredNotes]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "project":
          aValue = a.project?.title || ""
          bValue = b.project?.title || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [folderFilteredNotes, sortField, sortDirection])

  // Paginate notes
  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedNotes.slice(startIndex, endIndex)
  }, [sortedNotes, currentPage])

  const totalPages = Math.ceil(sortedNotes.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete note")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      if (selectedNote) setSelectedNote(null)
    },
  })

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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Notes</h1>
          <p className="text-muted-foreground">
            Your personal knowledge base
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-2 space-y-2">
          <h3 className="font-semibold mb-2 px-2">Folders</h3>
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedFolder(null)}
          >
            <List className="mr-2 h-4 w-4" />
            All Notes
          </Button>
          {folders.map(folder => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(folder)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {folder}
            </Button>
          ))}
        </div>

        <div className="col-span-12 lg:col-span-10">
          {viewMode === "grid" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-3 space-y-4">
                {filteredNotes.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No notes yet</p>
                      <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Note
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map((note) => {
                      const tags = note.tags ? JSON.parse(note.tags) : []
                      return (
                        <Card
                          key={note.id}
                          className={`cursor-pointer transition-colors hover:border-primary/50`}
                          onClick={() => setSelectedNote(note)}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg break-all">{note.title}</CardTitle>
                            <CardDescription>
                              Updated {formatDate(note.updatedAt)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {note.project ? (
                                <Badge variant="secondary" className="mb-2">
                                  {note.project.title}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="mb-2">
                                  General
                                </Badge>
                              )}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {tags.map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Notes ({filteredNotes.length})
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Showing {paginatedNotes.length} of {filteredNotes.length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center">
                            Title
                            <SortIcon field="title" />
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
                        <TableHead>Tags</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("updatedAt")}
                        >
                          <div className="flex items-center">
                            Updated
                            <SortIcon field="updatedAt" />
                          </div>
                        </TableHead>
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
                      {paginatedNotes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No notes found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedNotes.map((note) => {
                          const tags = note.tags ? JSON.parse(note.tags) : []
                          return (
                            <TableRow
                              key={note.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedNote(note)}
                            >
                              <TableCell className="font-medium">
                                {note.title}
                              </TableCell>
                              <TableCell>
                                {note.project ? (
                                  <Badge variant="secondary">
                                    {note.project.title}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">General</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {tags.slice(0, 3).map((tag: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {tags.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{tags.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatDate(note.updatedAt)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatDate(note.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedNote(note)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (
                                        confirm(
                                          "Are you sure you want to delete this note?"
                                        )
                                      ) {
                                        deleteMutation.mutate(note.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
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
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
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

          <CreateNoteDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

          <NoteViewerModal
            note={selectedNote}
            open={!!selectedNote}
            onOpenChange={(open) => {
              if (!open) setSelectedNote(null)
            }}
            onDelete={() => {
              if (
                selectedNote &&
                confirm("Are you sure you want to delete this note?")
              ) {
                deleteMutation.mutate(selectedNote.id)
                setSelectedNote(null)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
