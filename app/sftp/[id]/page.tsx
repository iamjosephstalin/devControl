"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Folder,
  File,
  ArrowLeft,
  RefreshCw,
  FileText,
  Loader2,
  Upload,
  Download,
  Trash2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SFTPFile {
  filename: string
  longname: string
  attrs: {
    size: number
    mtime: number
  }
  type: "d" | "-" | "l"
}

export default function SFTPPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.id as string
  const queryClient = useQueryClient()
  const [currentPath, setCurrentPath] = useState("/")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [isViewingFile, setIsViewingFile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: server, isLoading: serverLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}`)
      if (!res.ok) throw new Error("Failed to fetch server")
      return res.json()
    },
    enabled: !!serverId,
  })

  const { data, isLoading, refetch } = useQuery<{ files: SFTPFile[]; path: string }>({
    queryKey: ["sftp-files", serverId, currentPath],
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      try {
        const res = await fetch(`/api/servers/${serverId}/sftp?path=${encodeURIComponent(currentPath)}&action=list`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to fetch files")
        }
        return res.json()
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error("Request timeout - server may be slow or unreachable")
        }
        throw error
      }
    },
    enabled: !!serverId,
    staleTime: 5000, // Cache for 5 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
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
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for file reads
        
        const res = await fetch(
          `/api/servers/${serverId}/sftp?path=${encodeURIComponent(filePath)}&action=read`,
          { signal: controller.signal }
        )
        
        clearTimeout(timeoutId)
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to read file")
        }
        const data = await res.json()
        setFileContent(data.content)
        setSelectedFile(file.filename)
        setIsViewingFile(true)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          alert(`Failed to read file: Request timeout`)
        } else {
          alert(`Failed to read file: ${error.message}`)
        }
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

  const handleDownload = async (file: SFTPFile, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDownloading(file.filename)
    
    try {
      const filePath = currentPath === "/" 
        ? `/${file.filename}` 
        : `${currentPath}/${file.filename}`
      
      const res = await fetch(
        `/api/servers/${serverId}/sftp?path=${encodeURIComponent(filePath)}&action=download`
      )
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to download file")
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(`Failed to download file: ${error.message}`)
      console.error("Failed to download file", error)
    } finally {
      setIsDownloading(null)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const filePath = currentPath === "/" 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', filePath)

      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to upload file")
      }

      // Refresh the file list
      queryClient.invalidateQueries({ queryKey: ["sftp-files", serverId, currentPath] })
      alert(`File "${file.name}" uploaded successfully`)
    } catch (error: any) {
      alert(`Failed to upload file: ${error.message}`)
      console.error("Failed to upload file", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (file: SFTPFile, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return
    }

    try {
      const filePath = currentPath === "/" 
        ? `/${file.filename}` 
        : `${currentPath}/${file.filename}`
      
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', path: filePath }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete file")
      }

      // Refresh the file list
      queryClient.invalidateQueries({ queryKey: ["sftp-files", serverId, currentPath] })
    } catch (error: any) {
      alert(`Failed to delete file: ${error.message}`)
      console.error("Failed to delete file", error)
    }
  }

  const files = data?.files || []
  const directories = files.filter((f) => f.type === "d")
  const fileList = files.filter((f) => f.type !== "d")

  if (serverLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-mono font-semibold">
              SFTP Browser - {server?.name || "Loading..."}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {server?.host}:{server?.port}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
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

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">Path:</span>
            <Input
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  refetch()
                }
              }}
              className="font-mono text-sm max-w-md"
              placeholder="/"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Directories first */}
              {directories.map((file) => (
                <div
                  key={file.filename}
                  onClick={() => handleFileClick(file)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
                >
                  <Folder className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium font-mono truncate">{file.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(new Date(file.attrs.mtime * 1000))}
                    </div>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">Directory</Badge>
                </div>
              ))}

              {/* Files */}
              {fileList.map((file) => (
                <div
                  key={file.filename}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border group"
                >
                  <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="font-medium font-mono truncate">{file.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.attrs.size)} • {formatDate(new Date(file.attrs.mtime * 1000))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline">{formatFileSize(file.attrs.size)}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDownload(file, e)}
                      disabled={isDownloading === file.filename}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isDownloading === file.filename ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(file, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}

              {files.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Empty directory</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={isViewingFile} onOpenChange={setIsViewingFile}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
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
    </div>
  )
}

