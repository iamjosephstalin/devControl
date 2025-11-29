"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Folder,
  File,
  ArrowLeft,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  FolderPlus,
  FileText,
  Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SFTPBrowserProps {
  serverId: string
  serverName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SFTPFile {
  filename: string
  longname: string
  attrs: {
    size: number
    mtime: number
  }
  type: "d" | "-" | "l"
}

export function SFTPBrowser({
  serverId,
  serverName,
  open,
  onOpenChange,
}: SFTPBrowserProps) {
  const [currentPath, setCurrentPath] = useState("/")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [isViewingFile, setIsViewingFile] = useState(false)

  const { data, isLoading, refetch } = useQuery<{ files: SFTPFile[]; path: string }>({
    queryKey: ["sftp-files", serverId, currentPath],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/sftp?path=${encodeURIComponent(currentPath)}&action=list`)
      if (!res.ok) throw new Error("Failed to fetch files")
      return res.json()
    },
    enabled: open && !!serverId,
  })

  const navigateToPath = (path: string) => {
    if (path === "..") {
      const parts = currentPath.split("/").filter(Boolean)
      if (parts.length > 0) {
        parts.pop()
        setCurrentPath(parts.length > 0 ? `/${parts.join("/")}` : "/")
      } else {
        setCurrentPath("/")
      }
    } else {
      const newPath = currentPath === "/" ? `/${path}` : `${currentPath}/${path}`
      setCurrentPath(newPath)
    }
  }

  const handleFileClick = async (file: SFTPFile) => {
    if (file.type === "d") {
      navigateToPath(file.filename)
    } else {
      try {
        const filePath = currentPath === "/" 
          ? `/${file.filename}` 
          : `${currentPath}/${file.filename}`
        const res = await fetch(
          `/api/servers/${serverId}/sftp?path=${encodeURIComponent(filePath)}&action=read`
        )
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to read file")
        }
        const data = await res.json()
        setFileContent(data.content)
        setSelectedFile(file.filename)
        setIsViewingFile(true)
      } catch (error: any) {
        alert(`Failed to read file: ${error.message}`)
        console.error("Failed to read file", error)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const files = data?.files || []
  const directories = files.filter((f) => f.type === "d")
  const fileList = files.filter((f) => f.type !== "d")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono">SFTP Browser - {serverName}</DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                {currentPath}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentPath !== "/" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const parts = currentPath.split("/").filter(Boolean)
                    if (parts.length > 0) {
                      parts.pop()
                      setCurrentPath(parts.length > 0 ? `/${parts.join("/")}` : "/")
                    } else {
                      setCurrentPath("/")
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Up
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-1">
                {/* Directories first */}
                {directories.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => handleFileClick(file)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium font-mono">{file.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(file.attrs.mtime * 1000))}
                      </div>
                    </div>
                    <Badge variant="outline">Directory</Badge>
                  </div>
                ))}

                {/* Files */}
                {fileList.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => handleFileClick(file)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                  >
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium font-mono">{file.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.attrs.size)} • {formatDate(new Date(file.attrs.mtime * 1000))}
                      </div>
                    </div>
                    <Badge variant="outline">{formatFileSize(file.attrs.size)}</Badge>
                  </div>
                ))}

                {files.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Empty directory</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* File Viewer Dialog */}
        <Dialog open={isViewingFile} onOpenChange={setIsViewingFile}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-mono">{selectedFile}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {currentPath === "/" ? `/${selectedFile}` : `${currentPath}/${selectedFile}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded-lg p-4 bg-muted">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {fileContent}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

