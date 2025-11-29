"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import remarkGfm from "remark-gfm"
import { formatDate } from "@/lib/utils"

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

interface NoteViewerModalProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function NoteViewerModal({
  note,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: NoteViewerModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!note) return null

  const tags = note.tags ? JSON.parse(note.tags) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-2xl font-bold mb-2 font-mono">
                {note.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Updated {formatDate(note.updatedAt)}</span>
                {note.project && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">{note.project.title}</Badge>
                  </>
                )}
                {tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:border prose-img:border-border prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-th:bg-muted prose-td:border prose-td:border-border">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "")
                  const language = match ? match[1] : ""
                  return !inline && language ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={language}
                      PreTag="div"
                      className="rounded-lg !mt-4 !mb-4 !bg-[#1e1e1e]"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                h1: ({ children }) => (
                  <h1 className="text-4xl font-bold mt-8 mb-4 first:mt-0 font-mono">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-3xl font-bold mt-6 mb-3 font-mono">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-bold mt-4 mb-2 font-mono">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-xl font-bold mt-3 mb-2 font-mono">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-7">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1 ml-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-4 py-2">{children}</td>
                ),
                hr: () => <hr className="my-6 border-border" />,
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="rounded-lg border border-border my-4 max-w-full h-auto"
                  />
                ),
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

