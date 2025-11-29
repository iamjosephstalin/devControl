"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "@xterm/xterm/css/xterm.css"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export default function TerminalPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.id as string
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const inputBufferRef = useRef<string>("")

  const { data: server, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}`)
      if (!res.ok) throw new Error("Failed to fetch server")
      return res.json()
    },
    enabled: !!serverId,
  })

  const executeCommand = useCallback(async (command: string) => {
    setIsExecuting(true)
    const terminal = terminalInstanceRef.current
    if (!terminal) {
      setIsExecuting(false)
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for commands
      
      const res = await fetch(`/api/servers/${serverId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!res.ok) {
        const error = await res.json()
        terminal.writeln(`\r\n\x1b[31mError: ${error.error || "Command failed"}\x1b[0m`)
      } else {
        const data = await res.json()
        if (data.stdout) {
          terminal.write(data.stdout)
        }
        if (data.stderr) {
          terminal.write(`\x1b[33m${data.stderr}\x1b[0m`)
        }
        if (data.code !== null && data.code !== 0) {
          terminal.write(`\r\n\x1b[31mExit code: ${data.code}\x1b[0m`)
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        terminal.writeln(`\r\n\x1b[31mError: Command timeout (30s)\x1b[0m`)
      } else {
        terminal.writeln(`\r\n\x1b[31mError: ${error.message}\x1b[0m`)
      }
    } finally {
      setIsExecuting(false)
      terminal.write("\r\n$ ")
    }
  }, [serverId])

  useEffect(() => {
    if (!terminalRef.current || isLoading) return

    // Initialize terminal
    const terminal = new Terminal({
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#aeafad",
        selection: "#3a3d41",
      },
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 14,
      cursorBlink: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(terminalRef.current)

    fitAddon.fit()
    terminalInstanceRef.current = terminal
    fitAddonRef.current = fitAddon

    // Show welcome message
    if (server) {
      terminal.writeln(`\r\n\x1b[32mConnected to ${server.name} (${server.host}:${server.port})\x1b[0m`)
    }
    terminal.writeln(`\x1b[33mType commands and press Enter to execute\x1b[0m`)
    terminal.write("\r\n$ ")

    let executing = false

    // Handle input
    terminal.onData((data) => {
      if (executing) return

      if (data === "\r" || data === "\n") {
        // Enter pressed
        const command = inputBufferRef.current.trim()
        if (command) {
          terminal.write("\r\n")
          executing = true
          executeCommand(command).finally(() => {
            executing = false
          })
          setCommandHistory((prev) => [...prev, command])
          setHistoryIndex(-1)
          inputBufferRef.current = ""
        } else {
          terminal.write("\r\n$ ")
        }
      } else if (data === "\x7f" || data === "\b") {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          terminal.write("\b \b")
        }
      } else if (data === "\x1b[A") {
        // Up arrow - history
        setCommandHistory((prev) => {
          if (prev.length > 0) {
            const newIndex = historyIndex === -1 
              ? prev.length - 1 
              : Math.max(0, historyIndex - 1)
            setHistoryIndex(newIndex)
            const cmd = prev[newIndex]
            // Clear current line
            terminal.write("\r\x1b[K")
            terminal.write(`$ ${cmd}`)
            inputBufferRef.current = cmd
          }
          return prev
        })
      } else if (data === "\x1b[B") {
        // Down arrow - history
        setCommandHistory((prev) => {
          if (historyIndex !== -1) {
            const newIndex = historyIndex + 1
            if (newIndex >= prev.length) {
              setHistoryIndex(-1)
              terminal.write("\r\x1b[K")
              terminal.write("$ ")
              inputBufferRef.current = ""
            } else {
              setHistoryIndex(newIndex)
              const cmd = prev[newIndex]
              terminal.write("\r\x1b[K")
              terminal.write(`$ ${cmd}`)
              inputBufferRef.current = cmd
            }
          }
          return prev
        })
      } else if (data.charCodeAt(0) >= 32) {
        // Printable character
        inputBufferRef.current += data
        terminal.write(data)
      }
    })

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose()
        terminalInstanceRef.current = null
      }
    }
  }, [server, isLoading, executeCommand, historyIndex])

  if (isLoading) {
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
              SSH Terminal - {server?.name || "Loading..."}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {server?.host}:{server?.port}
            </p>
          </div>
        </div>
        {isExecuting && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Executing...
          </div>
        )}
      </div>
      <div className="flex-1 p-4">
        <div
          ref={terminalRef}
          className="w-full h-full bg-[#1e1e1e] rounded-lg overflow-hidden"
        />
      </div>
    </div>
  )
}

