"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Settings, RefreshCw, Trash2 } from "lucide-react"

export function IntegrationDiagnostics() {
  const [open, setOpen] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)

  const { data: envInfo, refetch: refetchEnv } = useQuery({
    queryKey: ['debug-env'],
    queryFn: async () => {
      const response = await fetch('/api/debug/env')
      if (!response.ok) throw new Error('Failed to fetch environment info')
      return response.json()
    },
    enabled: open
  })

  const handleRepair = async () => {
    setIsRepairing(true)
    try {
      const response = await fetch('/api/integrations/repair', {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Repair failed')
      
      const result = await response.json()
      alert(`Repair completed: ${result.results.corrupted} corrupted integrations found and marked as error`)
      
      // Refresh the page to reload integrations
      window.location.reload()
    } catch (error: any) {
      alert(`Repair failed: ${error.message}`)
    } finally {
      setIsRepairing(false)
    }
  }

  if (!envInfo) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Diagnostics
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Diagnostics</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">Loading...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Diagnostics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Integration Diagnostics</DialogTitle>
          <DialogDescription>
            Diagnose and fix integration issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Environment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Encryption Key</span>
                <Badge variant={envInfo.hasEncryptionKey ? "default" : "destructive"}>
                  {envInfo.hasEncryptionKey ? "Present" : "Missing"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Using Default Key</span>
                <Badge variant={envInfo.usingDefaultKey ? "secondary" : "default"}>
                  {envInfo.usingDefaultKey ? "Yes (Insecure)" : "No (Good)"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Encryption Working</span>
                <Badge variant={envInfo.encryptionWorking ? "default" : "destructive"}>
                  {envInfo.encryptionWorking ? "Yes" : "No"}
                </Badge>
              </div>

              {envInfo.encryptionError && (
                <div className="p-3 bg-destructive/10 rounded text-sm">
                  <strong>Encryption Error:</strong> {envInfo.encryptionError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Connected</span>
                <Badge variant={envInfo.hasDatabaseUrl ? "default" : "destructive"}>
                  {envInfo.hasDatabaseUrl ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Repair Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If integrations are showing errors or not working properly, try these repair options:
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="flex-1"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRepairing ? 'animate-spin' : ''}`} />
                  {isRepairing ? "Repairing..." : "Repair Corrupted"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchEnv()}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Common Issues:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Encryption key changed after creating integrations</li>
                  <li>Database corruption or connection issues</li>
                  <li>Invalid tokens or expired credentials</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}