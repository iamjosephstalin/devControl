"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "@xterm/xterm/css/xterm.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react"

interface SSHTerminalProps {
  serverId: string
  serverName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SSHTerminal({
  serverId,
  serverName,
  open,
  onOpenChange,
}: SSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const inputBufferRef = useRef<string>("")

  const executeCommand = useCallback(async (command: string) => {
    setIsExecuting(true)
    const terminal = terminalInstanceRef.current
    if (!terminal) {
      setIsExecuting(false)
      return
    }

    try {
      const res = await fetch(`/api/servers/${serverId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })

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
      terminal.writeln(`\r\n\x1b[31mError: ${error.message}\x1b[0m`)
    } finally {
      setIsExecuting(false)
      terminal.write("\r\n$ ")
    }
  }, [serverId])

  useEffect(() => {
    if (!open || !terminalRef.current) return

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
    terminal.writeln(`\r\n\x1b[32mConnected to ${serverName}\x1b[0m`)
    terminal.writeln(`\x1b[33mType commands and press Enter to execute\x1b[0m`)
    terminal.writeln(`\x1b[33mNote: This is a command-based terminal. For full interactive terminal, WebSocket support is required.\x1b[0m`)
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
  }, [open, serverId, serverName, executeCommand])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`p-0 ${isFullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-4xl h-[600px]"}`}
      >
        <DialogHeader className="px-6 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">SSH Terminal - {serverName}</span>
              {isExecuting && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4">
          <div
            ref={terminalRef}
            className="w-full h-[500px] bg-[#1e1e1e] rounded-lg overflow-hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
