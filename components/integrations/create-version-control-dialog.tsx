"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { VersionControlType, VERSION_CONTROL_TYPES, INTEGRATION_CONFIG, createIntegration } from "@/lib/integrations"
import { useQueryClient } from "@tanstack/react-query"

export function CreateVersionControlDialog() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<VersionControlType | "">("")
  const [name, setName] = useState("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  const config = type ? INTEGRATION_CONFIG[type] : null

  const handleCreate = async () => {
    if (!type || !name) {
      alert("Please fill in all required fields")
      return
    }

    // Validate required fields
    const requiredFields = config?.fields.filter((f: any) => f.required) || []
    for (const field of requiredFields) {
      if (!formData[field.key]) {
        alert(`${field.label} is required`)
        return
      }
    }

    setIsCreating(true)
    try {
      const { token, ...configData } = formData
      
      console.log('Creating integration with data:', {
        type,
        name,
        token: token ? '[PRESENT]' : '[MISSING]',
        config: configData
      })
      
      await createIntegration({
        type,
        name,
        token,
        config: configData
      })
      
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      
      // Reset form
      setOpen(false)
      setType("")
      setName("")
      setFormData({})
    } catch (error: any) {
      console.error('Integration creation failed:', error)
      alert(`Failed to create integration: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" />
          Connect Git Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Connect Git Account</DialogTitle>
          <DialogDescription>
            Connect your GitHub, GitLab, or Bitbucket account to access your repositories
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="type">Git Provider</Label>
            <Select onValueChange={(value) => setType(value as VersionControlType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a Git provider" />
              </SelectTrigger>
              <SelectContent>
                {VERSION_CONTROL_TYPES.map((key) => {
                  const config = INTEGRATION_CONFIG[key]
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.name}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {config && (
            <>
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`My ${config.name} Account`}
                  className="w-full"
                />
              </div>

              {config.fields.map((field: any) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                <strong>Need help?</strong> Create a token at{" "}
                <a
                  href={config.tokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {new URL(config.tokenUrl).hostname}
                </a>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            onClick={handleCreate}
            disabled={!type || !name || isCreating}
            className="flex-1"
          >
            {isCreating ? "Connecting..." : "Connect Account"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}