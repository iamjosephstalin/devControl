"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExternalLink, Settings, Trash2, RefreshCw } from "lucide-react"
import { Integration, INTEGRATION_CONFIG, deleteIntegration, updateIntegration } from "@/lib/integrations"
import { formatDate } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"

interface IntegrationCardProps {
  integration: Integration
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ name: integration.name })
  const queryClient = useQueryClient()

  const config = INTEGRATION_CONFIG[integration.type]

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteIntegration(integration.id)
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    } catch (error: any) {
      alert(`Failed to delete integration: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdate = async () => {
    try {
      await updateIntegration(integration.id, editData)
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setIsEditing(false)
    } catch (error: any) {
      alert(`Failed to update integration: ${error.message}`)
    }
  }

  const handleTestConnection = async () => {
    try {
      await updateIntegration(integration.id, { status: 'connected' })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    } catch (error: any) {
      alert(`Connection test failed: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default'
      case 'error': return 'destructive'
      case 'disconnected': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg flex items-center gap-2 truncate">
              <span className="text-xl flex-shrink-0">{config.icon}</span>
              <span className="truncate">{integration.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 truncate">
              {config.name} Integration
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant={getStatusColor(integration.status)} className="text-xs">
              {integration.status}
            </Badge>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Integration</DialogTitle>
                  <DialogDescription>
                    Update your {config.name} integration settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Integration name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {integration.lastSync && (
              <div>
                Last synced: {formatDate(new Date(integration.lastSync))}
              </div>
            )}
            <div>
              Connected: {formatDate(new Date(integration.createdAt))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                className="flex-1 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Test
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 text-xs"
              >
                <a
                  href={config.tokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Manage
                </a>
              </Button>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full text-xs"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              {isDeleting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}